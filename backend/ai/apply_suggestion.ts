import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../external_dbs/postgres/db";

interface ApplySuggestionParams {
  transactionId: string;
  createRule?: boolean;
}

interface ApplySuggestionResponse {
  success: boolean;
  ruleCreated?: boolean;
}

export const applySuggestion = api<ApplySuggestionParams, ApplySuggestionResponse>(
  { auth: true, expose: true, method: "POST", path: "/ai/apply-suggestion/:transactionId" },
  async ({ transactionId, createRule }) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    const txn = await db.queryRow<{
      ai_category: string | null;
      merchant: string | null;
      description: string;
    }>`
      SELECT ai_category, merchant, description
      FROM transactions
      WHERE id = ${transactionId} AND organization_id = ${orgId}
    `;

    if (!txn || !txn.ai_category) {
      throw new Error("Transaction not found or no AI suggestion available");
    }

    await db.exec`
      UPDATE transactions
      SET 
        category = ${txn.ai_category},
        is_manual_category = true
      WHERE id = ${transactionId}
    `;

    let ruleCreated = false;
    if (createRule && txn.merchant) {
      const normalizedMerchant = txn.merchant.toLowerCase().trim();
      
      const existingRule = await db.queryRow<{ id: string }>`
        SELECT id FROM categorization_rules
        WHERE organization_id = ${orgId}
          AND merchant_pattern = ${normalizedMerchant}
      `;

      if (!existingRule) {
        await db.exec`
          INSERT INTO categorization_rules (
            organization_id, merchant_pattern, category, 
            confidence, rule_type, created_by
          )
          VALUES (
            ${orgId}, ${normalizedMerchant}, ${txn.ai_category},
            1.0, 'manual', ${authData.userID}
          )
        `;
        ruleCreated = true;
      }
    }

    return { success: true, ruleCreated };
  }
);
