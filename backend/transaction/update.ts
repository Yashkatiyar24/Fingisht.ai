import { api, APIError } from "encore.dev/api";
import db from "../db";

interface UpdateParams {
  id: number;
  date?: Date;
  amount?: number;
  merchant?: string;
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

// Updates an existing transaction
export const update = api<UpdateParams, Transaction>(
  { expose: true, method: "PUT", path: "/transactions/:id" },
  async (params) => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (params.date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(params.date);
    }
    if (params.amount !== undefined) {
      updates.push(`amount = $${paramCount++}`);
      values.push(params.amount);
    }
    if (params.merchant !== undefined) {
      updates.push(`merchant = $${paramCount++}`);
      values.push(params.merchant);
    }
    if (params.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(params.description);
    }
    if (params.categoryId !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(params.categoryId);
    }
    if (params.currency !== undefined) {
      updates.push(`currency = $${paramCount++}`);
      values.push(params.currency);
    }
    if (params.paymentMethod !== undefined) {
      updates.push(`payment_method = $${paramCount++}`);
      values.push(params.paymentMethod);
    }
    if (params.tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(params.tags);
    }
    if (params.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(params.notes);
    }
    if (params.isRecurring !== undefined) {
      updates.push(`is_recurring = $${paramCount++}`);
      values.push(params.isRecurring);
    }

    updates.push(`updated_at = NOW()`);
    
    const query = `
      UPDATE transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING
        id, date, amount, merchant, description,
        category_id as "categoryId", currency,
        payment_method as "paymentMethod", tags, notes,
        is_recurring as "isRecurring"
    `;

    const result = await db.rawQueryRow<Transaction>(query, ...values, params.id);
    
    if (!result) {
      throw APIError.notFound("transaction not found");
    }

    return result;
  }
);
