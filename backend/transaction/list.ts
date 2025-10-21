import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Query } from "encore.dev/api";
import db from "../db";

interface Transaction {
  id: number;
  date: Date;
  amount: number;
  merchant: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  currency: string;
  paymentMethod: string | null;
  tags: string[];
  notes: string | null;
  isRecurring: boolean;
}

interface ListParams {
  limit?: Query<number>;
  offset?: Query<number>;
  categoryId?: Query<number>;
  startDate?: Query<string>;
  endDate?: Query<string>;
  search?: Query<string>;
}

interface ListResponse {
  transactions: Transaction[];
  total: number;
}

// Lists transactions with optional filters
export const list = api<ListParams, ListResponse>(
  { auth: true, expose: true, method: "GET", path: "/transactions" },
  async ({ limit, offset, categoryId, startDate, endDate, search }) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    
    if (categoryId) {
      whereClause += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    
    if (startDate) {
      whereClause += ` AND t.date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ` AND t.date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    if (search) {
      const paramNum = params.length + 1;
      whereClause += ` AND (t.merchant ILIKE $${paramNum} OR t.description ILIKE $${paramNum})`;
      params.push(`%${search}%`);
    }

    const query = `
      SELECT 
        t.id, t.date, t.amount, t.merchant, t.description,
        t.category_id as "categoryId", c.name as "categoryName", c.color as "categoryColor",
        t.currency, t.payment_method as "paymentMethod", t.tags, t.notes, t.is_recurring as "isRecurring"
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;

    const transactions = await db.rawQueryAll<Transaction>(query, ...params, limit || 50, offset || 0);
    const totalResult = await db.rawQueryRow<{ total: number }>(countQuery, ...params);

    return {
      transactions,
      total: totalResult?.total || 0,
    };
  }
);
