CREATE OR REPLACE FUNCTION get_budgets_with_spending(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category_id uuid,
  amount numeric(14,2),
  period text,
  created_at timestamptz,
  category_name text,
  spent numeric(14,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.category_id,
    b.amount,
    b.period,
    b.created_at,
    c.name as category_name,
    COALESCE(SUM(t.amount), 0) as spent
  FROM
    budgets b
  JOIN
    categories c ON b.category_id = c.id
  LEFT JOIN
    transactions t ON b.category_id = t.category_id
                   AND t.user_id = b.user_id
                   AND t.occurred_at >= date_trunc(
                       CASE
                         WHEN b.period = 'monthly' THEN 'month'
                         WHEN b.period = 'weekly' THEN 'week'
                         WHEN b.period = 'yearly' THEN 'year'
                       END,
                       CURRENT_DATE
                     )
  WHERE
    b.user_id = user_id_param
  GROUP BY
    b.id, c.name;
END;
$$ LANGUAGE plpgsql;
