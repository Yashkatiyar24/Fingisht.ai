-- Function to get daily spending for a user
CREATE OR REPLACE FUNCTION get_daily_spending(user_id_param uuid, start_date_param date, end_date_param date)
RETURNS table(date date, spend numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date::date,
    COALESCE(SUM(ABS(t.amount)), 0) as spend
  FROM generate_series(start_date_param, end_date_param, '1 day') as d
  LEFT JOIN transactions t ON t.occurred_at::date = d.date AND t.user_id = user_id_param AND t.type = 'debit'
  GROUP BY d.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql;
