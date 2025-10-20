import { api } from "encore.dev/api";
import db from "../db";

interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  parentId: number | null;
  isSystem: boolean;
}

interface ListResponse {
  categories: Category[];
}

// Lists all categories
export const list = api<void, ListResponse>(
  { expose: true, method: "GET", path: "/categories" },
  async () => {
    const categories = await db.queryAll<Category>`
      SELECT 
        id, name, color, icon,
        parent_id as "parentId",
        is_system as "isSystem"
      FROM categories
      ORDER BY name
    `;

    return { categories };
  }
);
