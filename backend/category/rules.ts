import { api } from "encore.dev/api";
import db from "../db";

interface Rule {
  id: number;
  pattern: string;
  categoryId: number;
  categoryName: string;
  priority: number;
  confidence: number;
}

interface ListRulesResponse {
  rules: Rule[];
}

// Lists all categorization rules
export const listRules = api<void, ListRulesResponse>(
  { expose: true, method: "GET", path: "/categories/rules" },
  async () => {
    const rules = await db.queryAll<Rule>`
      SELECT 
        r.id, r.pattern, r.category_id as "categoryId",
        c.name as "categoryName", r.priority, r.confidence
      FROM category_rules r
      JOIN categories c ON r.category_id = c.id
      ORDER BY r.priority DESC, r.id
    `;

    return { rules };
  }
);

interface CreateRuleParams {
  pattern: string;
  categoryId: number;
  priority?: number;
  confidence?: number;
}

// Creates a new categorization rule
export const createRule = api<CreateRuleParams, Rule>(
  { expose: true, method: "POST", path: "/categories/rules" },
  async (params) => {
    const result = await db.queryRow<Rule>`
      INSERT INTO category_rules (pattern, category_id, priority, confidence)
      VALUES (
        ${params.pattern},
        ${params.categoryId},
        ${params.priority || 0},
        ${params.confidence || 1.0}
      )
      RETURNING
        id, pattern, category_id as "categoryId",
        (SELECT name FROM categories WHERE id = category_id) as "categoryName",
        priority, confidence
    `;

    return result!;
  }
);
