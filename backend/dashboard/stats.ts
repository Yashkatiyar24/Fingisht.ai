import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

interface StatsParams {
  startDate?: Query<string>;
  endDate?: Query<string>;
}

interface CategorySpend {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  total: number;
}

interface DailySpend {
  date: string;
  total: number;
}

interface TopMerchant {
  merchant: string;
  total: number;
  count: number;
}

interface StatsResponse {
  totalSpend: number;
  transactionCount: number;
  avgPerDay: number;
  topCategory: CategorySpend | null;
  categoryBreakdown: CategorySpend[];
  dailySpend: DailySpend[];
  topMerchants: TopMerchant[];
}

// Returns dashboard statistics
export const getStats = api<StatsParams, StatsResponse>(
  { auth: true, expose: true, method: "GET", path: "/dashboard/stats" },
  async ({ startDate, endDate }) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");
    const startStr = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endStr = endDate || new Date().toISOString();

    const totals = await db.queryRow<{ total: number; count: number }>`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= ${startStr} AND date <= ${endStr} AND amount > 0
    `;

    const categoryBreakdown = await db.queryAll<CategorySpend>`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        c.color as "categoryColor",
        COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.date >= ${startStr} AND t.date <= ${endStr} AND t.amount > 0
      GROUP BY c.id, c.name, c.color
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY total DESC
    `;

    const dailySpend = await db.queryAll<DailySpend>`
      SELECT 
        DATE(date) as date,
        SUM(amount) as total
      FROM transactions
      WHERE date >= ${startStr} AND date <= ${endStr} AND amount > 0
      GROUP BY DATE(date)
      ORDER BY date
    `;

    const topMerchants = await db.queryAll<TopMerchant>`
      SELECT 
        merchant,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= ${startStr} AND date <= ${endStr} AND amount > 0
      GROUP BY merchant
      ORDER BY total DESC
      LIMIT 10
    `;

    const days = Math.ceil((new Date(endStr).getTime() - new Date(startStr).getTime()) / (1000 * 60 * 60 * 24)) || 1;

    return {
      totalSpend: totals?.total || 0,
      transactionCount: totals?.count || 0,
      avgPerDay: (totals?.total || 0) / days,
      topCategory: categoryBreakdown[0] || null,
      categoryBreakdown,
      dailySpend,
      topMerchants,
    };
  }
);
