import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts'
import { createHash } from "https://deno.land/std@0.119.0/hash/mod.ts";

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY');

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
    const payload = await verify(jwt, CLERK_PEM_PUBLIC_KEY, 'RS256')
    const userId = payload.sub

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

    if (batchError) {
      throw batchError
    }

    const transactions = rows.map((row) => {
      const amount = parseFloat(row[mappedHeaders.amount].replace(/[₹,]/g, ''))
      const occurredAt = new Date(row[mappedHeaders.date]).toISOString().split('T')[0]
      const merchant = row[mappedHeaders.merchant]
      const description = row[mappedHeaders.description]

      const hash = createHash("sha256");
      hash.update(`${userId}|${occurredAt}|${amount}|${merchant}|${description}`);
      const rowHash = hash.toString();

      return {
        user_id: userId,
        occurred_at: occurredAt,
        merchant,
        description,
        amount,
        type: amount < 0 ? 'debit' : 'credit',
        raw_category: row[mappedHeaders.raw_category],
        import_batch_id: batch.id,
        row_hash: rowHash,
      }
    })

    const { data, error, count } = await supabase
      .from('transactions')
      .insert(transactions, { onConflict: 'row_hash' })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      insertedCount: count,
      skippedCount: rows.length - count,
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
