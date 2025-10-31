import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import db from "../external_dbs/postgres/db";

interface DetectAnomaliesResponse {
  detected: number;
  organizations: number;
}

async function detectAnomaliesForOrg(orgId: string): Promise<number> {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const dailySpending = await db.queryAll<{
    date: string;
    total: number;
  }>`
    SELECT 
      DATE(date) as date,
      SUM(amount) as total
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${last30Days}
      AND amount > 0
    GROUP BY DATE(date)
    ORDER BY date
  `;

  if (dailySpending.length < 7) {
    return 0;
  }

  const amounts = dailySpending.map(d => d.total);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length
  );

  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
  const deviations = amounts.map(x => Math.abs(x - median));
  const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)] * 1.4826;

  let anomaliesDetected = 0;

  for (const day of dailySpending) {
    const zScore = stdDev > 0 ? Math.abs((day.total - mean) / stdDev) : 0;
    const madScore = mad > 0 ? Math.abs((day.total - median) / mad) : 0;

    let severity: string | null = null;
    let type = "high_spending";

    if (zScore > 3 || madScore > 3.5) {
      severity = "high";
    } else if (zScore > 2.5 || madScore > 3) {
      severity = "medium";
    } else if (zScore > 2 || madScore > 2.5) {
      severity = "low";
    }

    if (severity) {
      const existing = await db.queryRow<{ id: string }>`
        SELECT id FROM anomalies
        WHERE organization_id = ${orgId}
          AND date = ${day.date}
      `;

      if (!existing) {
        await db.exec`
          INSERT INTO anomalies (
            organization_id, date, amount, z_score, mad_score, type, severity
          )
          VALUES (
            ${orgId}, ${day.date}, ${day.total}, ${zScore}, ${madScore}, ${type}, ${severity}
          )
        `;
        anomaliesDetected++;
      }
    }
  }

  return anomaliesDetected;
}

export const detectAnomalies = api<{}, DetectAnomaliesResponse>(
  { auth: false, expose: false, method: "POST", path: "/ai/detect-anomalies" },
  async () => {
    const orgs = await db.queryAll<{ id: string }>`
      SELECT DISTINCT organization_id as id
      FROM transactions
      WHERE date >= NOW() - INTERVAL '30 days'
    `;

    let totalDetected = 0;

    for (const org of orgs) {
      const detected = await detectAnomaliesForOrg(org.id);
      totalDetected += detected;
    }

    return {
      detected: totalDetected,
      organizations: orgs.length,
    };
  }
);

export const detectAnomaliesCron = api(
  { auth: false, expose: false, method: "POST", path: "/ai/detect-anomalies-cron" },
  async () => {
    return await detectAnomalies({});
  }
);

const _ = new CronJob("anomaly-detection", {
  title: "Detect spending anomalies",
  schedule: "0 2 * * *",
  endpoint: detectAnomaliesCron,
});

interface GetAnomaliesResponse {
  anomalies: Array<{
    id: string;
    date: string;
    amount: number;
    zScore: number;
    madScore: number;
    type: string;
    severity: string;
    acknowledged: boolean;
  }>;
}

export const getAnomalies = api<{}, GetAnomaliesResponse>(
  { auth: true, expose: true, method: "GET", path: "/ai/anomalies" },
  async () => {
    const { getAuthData } = await import("~encore/auth");
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    const anomalies = await db.queryAll<{
      id: string;
      date: string;
      amount: number;
      z_score: number;
      mad_score: number;
      type: string;
      severity: string;
      acknowledged: boolean;
    }>`
      SELECT 
        id, date, amount, 
        z_score, mad_score,
        type, severity, acknowledged
      FROM anomalies
      WHERE organization_id = ${orgId}
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      anomalies: anomalies.map(a => ({
        id: a.id,
        date: a.date,
        amount: a.amount,
        zScore: a.z_score,
        madScore: a.mad_score,
        type: a.type,
        severity: a.severity,
        acknowledged: a.acknowledged,
      })),
    };
  }
);

interface AcknowledgeAnomalyParams {
  anomalyId: string;
}

export const acknowledgeAnomaly = api<AcknowledgeAnomalyParams, { success: boolean }>(
  { auth: true, expose: true, method: "POST", path: "/ai/anomalies/:anomalyId/acknowledge" },
  async ({ anomalyId }) => {
    const { getAuthData } = await import("~encore/auth");
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    await db.exec`
      UPDATE anomalies
      SET acknowledged = true
      WHERE id = ${anomalyId} AND organization_id = ${orgId}
    `;

    return { success: true };
  }
);
