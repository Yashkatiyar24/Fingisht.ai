import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { Clerk } from 'https://deno.land/x/clerk_deno@v0.0.6/mod.ts';

const clerk = new Clerk(Deno.env.get('CLERK_SECRET_KEY'));

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
    const session = await clerk.verifyToken(jwt);
    if (!session || !session.sub) {
      throw new Error('Invalid or expired token');
    }
    const userId = session.sub;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startDate = params.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = params.get('end') || new Date().toISOString().split('T')[0]

    const { data: totals, error: totalsError } = await supabase.rpc('get_dashboard_totals', {
      user_id_param: userId,
      start_date_param: startDate,
      end_date_param: endDate,
    }).single()

    if (totalsError) throw totalsError

    const { data: byCategory, error: byCategoryError } = await supabase.rpc('get_dashboard_by_category', {
      user_id_param: userId,
      start_date_param: startDate,
      end_date_param: endDate,
    })

    if (byCategoryError) throw byCategoryError

    const { data: trend, error: trendError } = await supabase.rpc('get_dashboard_trend', {
      user_id_param: userId,
      start_date_param: startDate,
      end_date_param: endDate,
    })

    if (trendError) throw trendError

    return new Response(JSON.stringify({
      totals,
      byCategory,
      trend,
      range: { start: startDate, end: endDate },
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
