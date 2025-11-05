
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

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('get_daily_spending', {
        user_id_param: userId,
        start_date_param: ninetyDaysAgo,
        end_date_param: today
    });

    if(error) throw error;

    const totalSpending = data.reduce((acc, row) => acc + row.spend, 0);
    const averageDailySpending = totalSpending / 90;
    const forecastedSpending = averageDailySpending * 30;

    return new Response(JSON.stringify({ forecastedSpending }), {
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
