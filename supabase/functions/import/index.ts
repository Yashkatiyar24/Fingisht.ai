import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts'
import { createHash } from "https://deno.land/std@0.119.0/hash/mod.ts";

// This is the Public Key from your Clerk JWT verification settings
const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY');

// The djwt library expects the key to be in a specific format,
// so we need to wrap it with the standard PEM headers and footers.
const formatClerkKey = (key: string) => {
  return `-----BEGIN PUBLIC KEY-----\\n${key}\\n-----END PUBLIC KEY-----`;
};

// Function to safely parse and format dates
// Supports DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
const parseDate = (dateString: string): string => {
  if (!dateString) throw new Error("Date string is empty or undefined.");

  let date;
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      // Basic heuristic for DD/MM vs MM/DD
      if (month > 12) { // Likely DD/MM/YYYY
        date = new Date(year, month - 1, day);
      } else { // Assume MM/DD/YYYY as a fallback
        date = new Date(year, month - 1, day);
      }
    }
  } else { // Assume YYYY-MM-DD or other ISO-like formats
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  // Return in YYYY-MM-DD format
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
    // Verify the JWT with the formatted Clerk public key
    const formattedKey = formatClerkKey(CLERK_PEM_PUBLIC_KEY);
    const payload = await verify(jwt, formattedKey, 'RS256')
    if (!payload.sub) {
      throw new Error('Invalid JWT payload: missing sub');
    }
    const userId = payload.sub

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Start a transaction with the database
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
        // Normalize amount: remove currency symbols, commas, and parse as a float
        const amountStr = String(row[mappedHeaders.amount] || '').replace(/[₹,]/g, '').trim();
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) continue; // Skip rows where amount is not a valid number

        // Normalize and validate other fields
        const occurredAt = parseDate(row[mappedHeaders.date]);
        const merchant = String(row[mappedHeaders.merchant] || '').trim().replace(/\s+/g, ' ');
        const description = String(row[mappedHeaders.description] || '').trim().replace(/\s+/g, ' ');

        // Create a unique hash for idempotency
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

        // Only include the raw_category if the user mapped it
        if (mappedHeaders.category && row[mappedHeaders.category]) {
          transaction.raw_category = String(row[mappedHeaders.category]).trim();
        }

        transactionsToInsert.push(transaction);
      } catch (e) {
        // If a single row fails validation (e.g., bad date), skip it and count it.
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

    // Insert all valid transactions, ignoring conflicts on the unique row_hash
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
