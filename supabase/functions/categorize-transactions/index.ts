
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts'

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY');
const AI_SERVICE_URL = Deno.env.get('AI_SERVICE_URL') || 'http://localhost:8001/predict';

const formatClerkKey = (key: string) => {
  return `-----BEGIN PUBLIC KEY-----\\n${key}\\n-----END PUBLIC KEY-----`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    const { transactions } = await req.json()

    // Get uncategorized transactions
    const { data: uncategorized, error: fetchError } = await supabase
      .from('transactions')
      .select('id, description, merchant')
      .eq('user_id', userId)
      .is('category_id', null)

    if (fetchError) throw fetchError;

    const textsToCategorize = uncategorized.map(t => `${t.merchant} ${t.description}`);

    const aiResponse = await fetch(AI_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: textsToCategorize })
    });

    if(!aiResponse.ok) {
        throw new Error('AI service call failed');
    }

    const { predictions } = await aiResponse.json();

    const updates = [];
    for (let i = 0; i < uncategorized.length; i++) {
        const transaction = uncategorized[i];
        const categoryName = predictions[i];

        if(categoryName !== 'Uncategorized') {
            const { data: category, error: catError } = await supabase
                .from('categories')
                .select('id')
                .eq('name', categoryName)
                .single();

            if(catError) {
                console.error('Error fetching category:', catError);
                continue;
            }

            if(category) {
                 updates.push(
                    supabase
                        .from('transactions')
                        .update({ category_id: category.id })
                        .eq('id', transaction.id)
                );
            }
        }
    }

    await Promise.all(updates);

    return new Response(JSON.stringify({ success: true, categorized: updates.length }), {
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
