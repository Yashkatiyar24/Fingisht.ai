import { api } from "encore.dev/api";
import db from "../db";

// Deletes a transaction
export const deleteTransaction = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/transactions/:id" },
  async ({ id }) => {
    await db.exec`DELETE FROM transactions WHERE id = ${id}`;
  }
);
