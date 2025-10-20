import { api } from "encore.dev/api";
import db from "../db";

interface Budget {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  alertThreshold: number;
  spent: number;
  percentage: number;
}

interface ListResponse {
  budgets: Budget[];
}

// Lists all budgets with current spending
export const list = api<{}, ListResponse>(
  { expose: true, method: "GET", path: "/budgets" },
  async () => {
    const budgets = await db.queryAll<Budget>`
      SELECT 
        b.id, b.category_id as "categoryId",
        c.name as "categoryName", c.color as "categoryColor",
        b.amount, b.period_start as "periodStart",
        b.period_end as "periodEnd", b.alert_threshold as "alertThreshold",
        COALESCE(SUM(t.amount), 0) as spent,
        CASE 
          WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount) * 100
          ELSE 0
        END as percentage
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = b.category_id
        AND t.date >= b.period_start AND t.date <= b.period_end
      WHERE b.period_end >= NOW()
      GROUP BY b.id, c.name, c.color
      ORDER BY b.period_start DESC
    `;

    return { budgets };
  }
);
