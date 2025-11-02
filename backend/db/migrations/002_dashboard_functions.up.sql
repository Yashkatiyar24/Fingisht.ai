-- Function to get dashboard totals
CREATE OR REPLACE FUNCTION get_dashboard_totals(user_id_param uuid, start_date_param date, end_date_param date)
RETURNS table(income numeric, expenses numeric, savingsRate numeric, txCount bigint) AS $$
BEGIN
  RETURN QUERY
  WITH tx_data AS (
    SELECT
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN ABS(amount) ELSE 0 END), 0) as expenses,
      COUNT(*) as tx_count
    FROM transactions
    WHERE user_id = user_id_param
    AND occurred_at BETWEEN start_date_param AND end_date_param
  )
  SELECT
    income,
    expenses,
    CASE WHEN income > 0 THEN ((income - expenses) / income) * 100 ELSE 0 END as savings_rate,
    tx_count
  FROM tx_data;
END;
$$ LANGUAGE plpgsql;

-- Function to get spending by category
CREATE OR REPLACE FUNCTION get_dashboard_by_category(user_id_param uuid, start_date_param date, end_date_param date)
RETURNS table(category text, amount numeric, pct numeric) AS $$
BEGIN
  RETURN QUERY
  WITH total_expenses AS (
    SELECT COALESCE(SUM(ABS(amount)), 1) as total
    FROM transactions
    WHERE user_id = user_id_param
    AND type = 'debit'
    AND occurred_at BETWEEN start_date_param AND end_date_param
  )
  SELECT
    COALESCE(c.name, 'Uncategorized') as category,
    SUM(ABS(t.amount)) as amount,
    (SUM(ABS(t.amount)) / (SELECT total FROM total_expenses)) * 100 as pct
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = user_id_param
  AND t.type = 'debit'
  AND t.occurred_at BETWEEN start_date_param AND end_date_param
  GROUP BY COALESCE(c.name, 'Uncategorized')
  ORDER BY amount DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily spending trend
CREATE OR REPLACE FUNCTION get_dashboard_trend(user_id_param uuid, start_date_param date, end_date_param date)
RETURNS table(date date, spend numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date::date,
    COALESCE(SUM(ABS(t.amount)), 0) as spend
  FROM generate_series(start_date_param, end_date_param, '1 day') as d
  LEFT JOIN transactions t ON t.occurred_at = d.date AND t.user_id = user_id_param AND t.type = 'debit'
  GROUP BY d.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql;
