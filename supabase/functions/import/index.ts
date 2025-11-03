import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { Clerk } from 'https://deno.land/x/clerk_deno@v0.0.6/mod.ts';
import { createHash } from "https://deno.land/std@0.119.0/hash/mod.ts";

const clerk = new Clerk(Deno.env.get('CLERK_SECRET_KEY'));

const parseDate = (dateString: string): string => {
  if (!dateString) throw new Error("Date string is empty or undefined.");

  let date;
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (month > 12) {
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(year, month - 1, day);
      }
    }
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  return date.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rows, mappedHeaders, fileMeta } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const jwt = authHeader.split(' ')[1]
    const session = await clerk.verifyToken(jwt);
    if (!session || !session.sub) {
      throw new Error('Invalid or expired token');
    }
    const userId = session.sub;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        user_id: userId,
        filename: fileMeta.name,
        checksum: fileMeta.checksum,
        row_count: rows.length,
      })
      .select()
      .single()

    if (batchError) throw batchError

    const transactionsToInsert = [];
    let skippedCount = 0;

    for (const row of rows) {
      try {
        const amountStr = String(row[mappedHeaders.amount] || '').replace(/[₹,]/g, '').trim();
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) continue;

        const occurredAt = parseDate(row[mappedHeaders.date]);
        const merchant = String(row[mappedHeaders.merchant] || '').trim().replace(/\s+/g, ' ');
        const description = String(row[mappedHeaders.description] || '').trim().replace(/\s+/g, ' ');

        const hash = createHash("sha256");
        hash.update(`${userId}|${occurredAt}|${amount}|${merchant}|${description}`);
        const rowHash = hash.toString();

        const transaction = {
          user_id: userId,
          occurred_at: occurredAt,
          merchant,
          description,
          amount,
          type: amount > 0 ? 'credit' : 'debit',
          import_batch_id: batch.id,
          row_hash: rowHash,
          raw_category: undefined,
        };

        if (mappedHeaders.category && row[mappedHeaders.category]) {
          transaction.raw_category = String(row[mappedHeaders.category]).trim();
        }

        transactionsToInsert.push(transaction);
      } catch (e) {
        console.error("Skipping row due to error:", e.message);
        skippedCount++;
      }
    }

    if (transactionsToInsert.length === 0) {
      return new Response(JSON.stringify({
        insertedCount: 0,
        skippedCount: rows.length,
        batchId: batch.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { error: insertError, count: insertedCount } = await supabase
      .from('transactions')
      .insert(transactionsToInsert, { onConflict: 'row_hash' });

    if (insertError) throw insertError

    return new Response(JSON.stringify({
      insertedCount: insertedCount || 0,
      skippedCount: rows.length - (insertedCount || 0),
      batchId: batch.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
