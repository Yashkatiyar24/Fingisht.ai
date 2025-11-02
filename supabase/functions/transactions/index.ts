import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verify } from 'https://deno.land/x/djwt@v2.7/mod.ts'

const CLERK_PEM_PUBLIC_KEY = Deno.env.get('CLERK_PEM_PUBLIC_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const params = url.searchParams

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

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (params.has('q')) {
      query = query.textSearch('description', params.get('q'))
    }
    if (params.has('start')) {
      query = query.gte('occurred_at', params.get('start'))
    }
    if (params.has('end')) {
      query = query.lte('occurred_at', params.get('end'))
    }
    if (params.has('batchId')) {
      query = query.eq('import_batch_id', params.get('batchId'))
    }

    const limit = parseInt(params.get('limit') || '20')
    const cursor = parseInt(params.get('cursor') || '0')
    query = query.range(cursor, cursor + limit - 1)
    query = query.order('occurred_at', { ascending: false })
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      transactions: data,
      nextCursor: data.length === limit ? cursor + limit : null,
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
