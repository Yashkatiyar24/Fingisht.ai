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

    if (req.method === 'GET') {
      const { data, error } = await supabase.rpc('get_budgets_with_spending', { user_id_param: userId });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (req.method === 'POST') {
      const { category_id, amount, period } = await req.json()
      const { data, error } = await supabase
        .from('budgets')
        .insert({ user_id: userId, category_id, amount, period })
        .select()
        .single()

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    } else if (req.method === 'PUT') {
      const { id, amount, period } = await req.json()
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount, period })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (req.method === 'DELETE') {
      const { id } = await req.json()
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error;
      return new Response(null, {
        headers: { ...corsHeaders },
        status: 204,
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
