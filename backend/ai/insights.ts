import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../external_dbs/postgres/db";

interface InsightsParams {
  periodStart?: Query<string>;
  periodEnd?: Query<string>;
}

interface Bullet {
  text: string;
  type: "info" | "warning" | "success";
  link?: string;
}

interface InsightsResponse {
  bullets: Bullet[];
  summary: string;
  periodStart: string;
  periodEnd: string;
}

export const getInsights = api<InsightsParams, InsightsResponse>(
  { auth: true, expose: true, method: "GET", path: "/ai/insights" },
  async ({ periodStart, periodEnd }) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    const settings = await db.queryRow<{ ai_insights_enabled: boolean }>`
      SELECT ai_insights_enabled
      FROM user_settings
      WHERE user_id = ${authData.userID}
    `;

    if (settings && !settings.ai_insights_enabled) {
      return {
        bullets: [],
        summary: "AI insights are disabled. Enable them in Settings to see personalized insights.",
        periodStart: periodStart || "",
        periodEnd: periodEnd || "",
      };
    }

    const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const end = periodEnd || new Date().toISOString();

    const cached = await db.queryRow<{
      bullets: any;
      summary: string;
    }>`
      SELECT bullets, summary
      FROM insights
      WHERE organization_id = ${orgId}
        AND period_start = ${start}
        AND period_end = ${end}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (cached) {
      return {
        bullets: cached.bullets,
        summary: cached.summary,
        periodStart: start,
        periodEnd: end,
      };
    }

    const insights = await generateInsights(orgId, start, end);

    await db.exec`
      INSERT INTO insights (organization_id, period_start, period_end, bullets, summary)
      VALUES (${orgId}, ${start}, ${end}, ${JSON.stringify(insights.bullets)}, ${insights.summary})
    `;

    return {
      ...insights,
      periodStart: start,
      periodEnd: end,
    };
  }
);

async function generateInsights(
  orgId: string,
  start: string,
  end: string
): Promise<{ bullets: Bullet[]; summary: string }> {
  const currentPeriodStats = await db.queryRow<{
    total: number;
    count: number;
    avg_daily: number;
  }>`
    SELECT 
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) / GREATEST(EXTRACT(DAY FROM (${end}::timestamp - ${start}::timestamp)), 1) as avg_daily
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${start}
      AND date <= ${end}
      AND amount > 0
  `;

  const prevStart = new Date(new Date(start).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const prevEnd = start;

  const prevPeriodStats = await db.queryRow<{
    total: number;
  }>`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${prevStart}
      AND date < ${prevEnd}
      AND amount > 0
  `;

  const topCategories = await db.queryAll<{
    category: string;
    total: number;
  }>`
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      SUM(amount) as total
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${start}
      AND date <= ${end}
      AND amount > 0
    GROUP BY category
    ORDER BY total DESC
    LIMIT 3
  `;

  const anomalies = await db.queryAll<{
    date: string;
    amount: number;
    severity: string;
  }>`
    SELECT date, amount, severity
    FROM anomalies
    WHERE organization_id = ${orgId}
      AND date >= ${start}
      AND date <= ${end}
      AND acknowledged = false
    ORDER BY date DESC
    LIMIT 3
  `;

  const bullets: Bullet[] = [];

  const momChange = prevPeriodStats && prevPeriodStats.total > 0
    ? ((currentPeriodStats!.total - prevPeriodStats.total) / prevPeriodStats.total) * 100
    : 0;

  if (Math.abs(momChange) > 10) {
    bullets.push({
      text: `Spending ${momChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(momChange).toFixed(1)}% vs last period`,
      type: momChange > 20 ? "warning" : momChange < -10 ? "success" : "info",
    });
  }

  if (topCategories.length > 0) {
    bullets.push({
      text: `Top spending: ${topCategories[0].category} (₹${topCategories[0].total.toFixed(0)})`,
      type: "info",
      link: `/transactions?category=${topCategories[0].category}`,
    });
  }

  if (anomalies.length > 0) {
    bullets.push({
      text: `${anomalies.length} unusual spending ${anomalies.length === 1 ? 'day' : 'days'} detected`,
      type: "warning",
    });
  }

  if (currentPeriodStats!.avg_daily > 0) {
    bullets.push({
      text: `Average daily spend: ₹${currentPeriodStats!.avg_daily.toFixed(0)}`,
      type: "info",
    });
  }

  const summary = `This period you spent ₹${currentPeriodStats!.total.toFixed(0)} across ${currentPeriodStats!.count} transactions. ${
    momChange > 10
      ? `Spending increased by ${momChange.toFixed(1)}% compared to last month, primarily driven by ${topCategories[0]?.category || 'various categories'}.`
      : momChange < -10
      ? `Great job! Spending decreased by ${Math.abs(momChange).toFixed(1)}% compared to last month.`
      : 'Spending remained relatively stable compared to last month.'
  }${anomalies.length > 0 ? ` We detected ${anomalies.length} unusual spending patterns that may need your attention.` : ''}`;

  return { bullets, summary };
}
