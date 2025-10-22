import { SQLDatabase } from "encore.dev/storage/sqldb";

// Connect to Supabase PostgreSQL
export default new SQLDatabase("postgres", {
  migrations: "./migrations",
});
