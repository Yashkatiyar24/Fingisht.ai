import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts'

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY');

const formatClerkKey = (key: string) => {
  return `-----BEGIN PUBLIC KEY-----\\n${key}\\n-----END PUBLIC KEY-----`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { batchId } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const jwt = authHeader.split(' ')[1]
    const formattedKey = formatClerkKey(CLERK_PEM_PUBLIC_KEY);
    const payload = await verify(jwt, formattedKey, 'RS256')
    const userId = payload.sub

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, merchant, description, amount')
      .eq('import_batch_id', batchId)
      .eq('user_id', userId)
      .is('category_id', null) // Only categorize transactions that don't have a category yet

    if (error) throw error;

    for (const txn of transactions) {
      const result = await categorizeSingleTransaction(supabase, userId, txn.merchant || txn.description, txn.amount, txn.description);

      if (result) {
        await supabase
          .from('transactions')
          .update({ category_id: result.category_id })
          .eq('id', txn.id);
      }
    }

    return new Response(JSON.stringify({ message: "Categorization complete" }), {
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

async function categorizeSingleTransaction(
  supabase: any,
  userId: string,
  merchant: string,
  amount: number,
  description: string
): Promise<{ category_id: string } | null> {
  const normalizedMerchant = merchant.toLowerCase().trim();

  // 1. Check for user-defined rules
  const { data: rule } = await supabase
    .from('categorization_rules')
    .select('category_id')
    .eq('user_id', userId)
    .ilike('merchant_pattern', `%${normalizedMerchant}%`)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  if (rule) return { category_id: rule.category_id };

  // 2. Check for known merchants
  const { data: knownMerchant } = await supabase
    .from('merchants')
    .select('category_id')
    .eq('user_id', userId)
    .eq('normalized_name', normalizedMerchant)
    .limit(1)
    .single();

  if (knownMerchant && knownMerchant.category_id) return { category_id: knownMerchant.category_id };

  // 3. Guess category from merchant name (heuristics)
  const categoryGuess = await guessCategoryFromMerchant(supabase, userId, normalizedMerchant, amount);
  if (categoryGuess) return { category_id: categoryGuess.category_id };

  return null;
}

async function guessCategoryFromMerchant(
  supabase: any,
  userId: string,
  merchant: string,
  amount: number
): Promise<{ category_id: string } | null> {
  const patterns = [
    { keywords: ["zomato", "swiggy", "uber eats", "food", "restaurant", "cafe"], category: "Food & Dining" },
    { keywords: ["amazon", "flipkart", "myntra", "shopping", "store"], category: "Shopping" },
    { keywords: ["uber", "ola", "taxi", "transport", "metro", "bus"], category: "Transportation" },
    { keywords: ["netflix", "spotify", "prime", "subscription"], category: "Entertainment" },
    { keywords: ["electricity", "water", "gas", "utility", "bill"], category: "Utilities" },
    { keywords: ["rent", "lease", "housing"], category: "Housing" },
    { keywords: ["hospital", "clinic", "pharmacy", "medical", "health"], category: "Healthcare" },
    { keywords: ["gym", "fitness", "yoga"], category: "Fitness" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => merchant.includes(kw))) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', pattern.category)
        .limit(1)
        .single();

      if (category) return { category_id: category.id };
    }
  }

  return null;
}
