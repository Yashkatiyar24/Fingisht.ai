import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
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
  { auth: true, expose: true, method: "POST", path: "/categories" },
  async (params) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");
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
