import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

type ImportRow = {
  date: string | null;
  description: string;
  amount: number;
  merchant: string;
  currency?: string | null;
  category_id?: string | null;
  ai_suggested_category?: string | null;
  ai_confidence?: number | null;
  raw_source?: string | null;
};

export const importTransactions = api<{ rows: ImportRow[] } , { inserted: number }>(
  { auth: true, expose: true, method: "POST", path: "/transactions/import" },
  async ({ rows }) => {
    const auth = getAuthData()!;
    const clerkUserId = auth.userID;
    if (!clerkUserId) throw new Error("No user");

    if (!rows?.length) return { inserted: 0 };

    // Insert in chunks for large uploads
    const chunk = 500;
    let inserted = 0;

      for (let i = 0; i < rows.length; i += chunk) {
        const batch = rows.slice(i, i + chunk);

        await db.exec`
        INSERT INTO transactions (
          clerk_user_id, date, description, amount, merchant,
          currency, category_id, ai_suggested_category, ai_confidence, raw
        )
        SELECT
          ${clerkUserId},
          to_timestamp(n.date, 'YYYY-MM-DD')::timestamptz,
          n.description,
          n.amount,
          n.merchant,
          coalesce(n.currency, 'INR'),
          nullif(n.category_id, '')::uuid,
          nullif(n.ai_suggested_category, ''),
          n.ai_confidence,
          n.raw_source::jsonb
        FROM jsonb_to_recordset(${JSON.stringify(
          batch.map(b => ({
            ...b,
            date: b.date ?? null,
            raw_source: b.raw_source ?? null,
          }))
        )}::jsonb)
        as n(date text, description text, amount numeric, merchant text,
             currency text, category_id text, ai_suggested_category text,
             ai_confidence numeric, raw_source text)
      `;

      inserted += batch.length;
    }

    // Optional: apply rules after import
    await db.exec`
      UPDATE transactions t
      SET category_id = r.category_id
      FROM category_rules r
      WHERE t.clerk_user_id = ${clerkUserId}
        AND r.clerk_user_id = t.clerk_user_id
        AND t.category_id IS NULL
        AND (
          t.merchant ILIKE '%' || r.keyword || '%'
          OR t.description ILIKE '%' || r.keyword || '%'
        )
    `;

    return { inserted };
  }
);
