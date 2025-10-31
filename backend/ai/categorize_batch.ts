import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../external_dbs/postgres/db";

interface CategorizeBatchParams {
  fileId: string;
}

interface CategorizeBatchResponse {
  totalProcessed: number;
  categorized: number;
  skipped: number;
}

export const categorizeBatch = api<CategorizeBatchParams, CategorizeBatchResponse>(
  { auth: true, expose: true, method: "POST", path: "/ai/categorize-batch" },
  async ({ fileId }) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    const transactions = await db.queryAll<{
      id: string;
      merchant: string | null;
      description: string;
      amount: number;
      category: string | null;
      is_manual_category: boolean;
    }>`
      SELECT id, merchant, description, amount, category, 
             COALESCE(is_manual_category, false) as is_manual_category
      FROM transactions
      WHERE organization_id = ${orgId}
        AND batch_id = ${fileId}
        AND is_manual_category = false
      ORDER BY date DESC
    `;

    let categorized = 0;
    let skipped = 0;

    for (const txn of transactions) {
      if (txn.is_manual_category) {
        skipped++;
        continue;
      }

      const result = await categorizeSingleTransaction(
        orgId,
        txn.merchant || txn.description,
        txn.amount,
        txn.description
      );

      if (result) {
        await db.exec`
          UPDATE transactions
          SET 
            ai_category = ${result.category},
            ai_confidence = ${result.confidence},
            ai_explanation = ${result.explanation},
            model_version = ${result.modelVersion},
            category = COALESCE(category, ${result.category})
          WHERE id = ${txn.id}
        `;
        categorized++;
      } else {
        skipped++;
      }
    }

    return {
      totalProcessed: transactions.length,
      categorized,
      skipped,
    };
  }
);

async function categorizeSingleTransaction(
  orgId: string,
  merchant: string,
  amount: number,
  description: string
): Promise<{
  category: string;
  confidence: number;
  explanation: string;
  modelVersion: string;
} | null> {
  const normalizedMerchant = merchant.toLowerCase().trim();

  const existingRule = await db.queryRow<{
    category: string;
    confidence: number;
  }>`
    SELECT category, confidence
    FROM categorization_rules
    WHERE organization_id = ${orgId}
      AND ${normalizedMerchant} ILIKE '%' || merchant_pattern || '%'
    ORDER BY priority DESC, confidence DESC
    LIMIT 1
  `;

  if (existingRule) {
    await db.exec`
      UPDATE categorization_rules
      SET usage_count = usage_count + 1
      WHERE organization_id = ${orgId}
        AND category = ${existingRule.category}
    `;

    return {
      category: existingRule.category,
      confidence: existingRule.confidence,
      explanation: `Matched rule for merchant pattern`,
      modelVersion: "rule-based-v1",
    };
  }

  const similarMerchant = await db.queryRow<{
    category: string;
  }>`
    SELECT category
    FROM merchants
    WHERE organization_id = ${orgId}
      AND category IS NOT NULL
      AND normalized_name = ${normalizedMerchant}
    LIMIT 1
  `;

  if (similarMerchant) {
    return {
      category: similarMerchant.category,
      confidence: 0.85,
      explanation: `Based on similar merchant: ${merchant}`,
      modelVersion: "merchant-match-v1",
    };
  }

  const categoryGuess = guessCategoryFromMerchant(normalizedMerchant, amount);
  if (categoryGuess) {
    return {
      category: categoryGuess.category,
      confidence: categoryGuess.confidence,
      explanation: categoryGuess.explanation,
      modelVersion: "heuristic-v1",
    };
  }

  return null;
}

function guessCategoryFromMerchant(
  merchant: string,
  amount: number
): { category: string; confidence: number; explanation: string } | null {
  const patterns = [
    { keywords: ["zomato", "swiggy", "uber eats", "food", "restaurant", "cafe"], category: "Food & Dining", confidence: 0.9 },
    { keywords: ["amazon", "flipkart", "myntra", "shopping", "store"], category: "Shopping", confidence: 0.85 },
    { keywords: ["uber", "ola", "taxi", "transport", "metro", "bus"], category: "Transportation", confidence: 0.9 },
    { keywords: ["netflix", "spotify", "prime", "subscription"], category: "Entertainment", confidence: 0.95 },
    { keywords: ["electricity", "water", "gas", "utility", "bill"], category: "Utilities", confidence: 0.9 },
    { keywords: ["rent", "lease", "housing"], category: "Housing", confidence: 0.95 },
    { keywords: ["hospital", "clinic", "pharmacy", "medical", "health"], category: "Healthcare", confidence: 0.9 },
    { keywords: ["gym", "fitness", "yoga"], category: "Fitness", confidence: 0.9 },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some(kw => merchant.includes(kw))) {
      return {
        category: pattern.category,
        confidence: pattern.confidence,
        explanation: `Merchant name contains keywords related to ${pattern.category}`,
      };
    }
  }

  return null;
}
