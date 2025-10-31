import { SQLDatabase } from "encore.dev/storage/sqldb";

declare module "encore.dev/storage/sqldb" {
  interface SQLDatabase {
    // 'sql' template helper is provided at runtime via encore; declare it to satisfy TS checks
    sql?: any;
  }
}
