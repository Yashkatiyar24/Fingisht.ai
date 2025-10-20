import { api } from "encore.dev/api";
import db from "../db";

interface CreateParams {
  name: string;
  color?: string;
  icon?: string;
  parentId?: number;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  parentId: number | null;
  isSystem: boolean;
}

// Creates a new category
export const create = api<CreateParams, Category>(
  { expose: true, method: "POST", path: "/categories" },
  async (params) => {
    const result = await db.queryRow<Category>`
      INSERT INTO categories (name, color, icon, parent_id, is_system)
      VALUES (
        ${params.name},
        ${params.color || '#6EE7F9'},
        ${params.icon || null},
        ${params.parentId || null},
        false
      )
      RETURNING
        id, name, color, icon,
        parent_id as "parentId",
        is_system as "isSystem"
    `;

    return result!;
  }
);
