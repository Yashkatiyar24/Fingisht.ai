import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateParams {
  categoryId: number;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  alertThreshold?: number;
}

interface Budget {
  id: number;
  categoryId: number;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  alertThreshold: number;
}

// Creates a new budget
export const create = api<CreateParams, Budget>(
  { auth: true, expose: true, method: "POST", path: "/budgets" },
  async (params) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");
    const result = await db.queryRow<Budget>`
      INSERT INTO budgets (category_id, amount, period_start, period_end, alert_threshold)
      VALUES (
        ${params.categoryId},
        ${params.amount},
        ${params.periodStart},
        ${params.periodEnd},
        ${params.alertThreshold || 0.8}
      )
      RETURNING
        id, category_id as "categoryId", amount,
        period_start as "periodStart", period_end as "periodEnd",
        alert_threshold as "alertThreshold"
    `;

    return result!;
  }
);
