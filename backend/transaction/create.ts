import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface CreateParams {
  date: Date;
  amount: number;
  merchant: string;
  description?: string;
  categoryId?: number;
  currency?: string;
  paymentMethod?: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
}

interface Transaction {
  id: number;
  date: Date;
  amount: number;
  merchant: string;
  description: string | null;
  categoryId: number | null;
  currency: string;
  paymentMethod: string | null;
  tags: string[];
  notes: string | null;
  isRecurring: boolean;
}

// Creates a new transaction
export const create = api<CreateParams, Transaction>(
  { auth: true, expose: true, method: "POST", path: "/transactions" },
  async (params) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");
    const result = await db.queryRow<Transaction>`
      INSERT INTO transactions (
        date, amount, merchant, description, category_id, currency,
        payment_method, tags, notes, is_recurring
      )
      VALUES (
        ${params.date}, ${params.amount}, ${params.merchant},
        ${params.description || null}, ${params.categoryId || null},
        ${params.currency || 'INR'}, ${params.paymentMethod || null},
        ${params.tags || []}, ${params.notes || null},
        ${params.isRecurring || false}
      )
      RETURNING
        id, date, amount, merchant, description,
        category_id as "categoryId", currency,
        payment_method as "paymentMethod", tags, notes,
        is_recurring as "isRecurring"
    `;

    return result!;
  }
);
