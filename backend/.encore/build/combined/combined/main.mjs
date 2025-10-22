// This file was bundled by Encore v1.50.6
//
// https://encore.dev
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// encore.gen/internal/auth/auth.ts
import { getAuthData as _getAuthData } from "encore.dev/internal/codegen/auth";
function getAuthData() {
  return _getAuthData();
}
var init_auth = __esm({
  "encore.gen/internal/auth/auth.ts"() {
    "use strict";
  }
});

// encore.gen/auth/index.ts
var auth_exports = {};
__export(auth_exports, {
  getAuthData: () => getAuthData
});
var init_auth2 = __esm({
  "encore.gen/auth/index.ts"() {
    "use strict";
    init_auth();
  }
});

// encore.gen/internal/entrypoints/combined/main.ts
import { registerGateways, registerHandlers, run } from "encore.dev/internal/codegen/appinit";

// auth/auth.ts
import { createClerkClient, verifyToken } from "@clerk/backend";
import { APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
var clerkSecretKey = secret("ClerkSecretKey");
var clerkClient = createClerkClient({ secretKey: clerkSecretKey() });
var auth = authHandler(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }
    try {
      const verifiedToken = await verifyToken(token, {
        secretKey: clerkSecretKey()
      });
      const user = await clerkClient.users.getUser(verifiedToken.sub);
      const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
        userId: user.id
      });
      const primaryOrgId = organizationMemberships.data[0]?.organization?.id || null;
      return {
        userID: user.id,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        organizationID: primaryOrgId
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);
var gw = new Gateway({ authHandler: auth });

// ai/apply_suggestion.ts
init_auth2();
import { api } from "encore.dev/api";

// external_dbs/postgres/db.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";
var db_default = new SQLDatabase("postgres", {
  migrations: "./migrations"
});

// ai/apply_suggestion.ts
var applySuggestion = api(
  { auth: true, expose: true, method: "POST", path: "/ai/apply-suggestion/:transactionId" },
  async ({ transactionId, createRule: createRule2 }) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const txn = await db_default.queryRow`
      SELECT ai_category, merchant, description
      FROM transactions
      WHERE id = ${transactionId} AND organization_id = ${orgId}
    `;
    if (!txn || !txn.ai_category) {
      throw new Error("Transaction not found or no AI suggestion available");
    }
    await db_default.exec`
      UPDATE transactions
      SET 
        category = ${txn.ai_category},
        is_manual_category = true
      WHERE id = ${transactionId}
    `;
    let ruleCreated = false;
    if (createRule2 && txn.merchant) {
      const normalizedMerchant = txn.merchant.toLowerCase().trim();
      const existingRule = await db_default.queryRow`
        SELECT id FROM categorization_rules
        WHERE organization_id = ${orgId}
          AND merchant_pattern = ${normalizedMerchant}
      `;
      if (!existingRule) {
        await db_default.exec`
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

// ai/categorize_batch.ts
init_auth2();
import { api as api2 } from "encore.dev/api";
var categorizeBatch = api2(
  { auth: true, expose: true, method: "POST", path: "/ai/categorize-batch" },
  async ({ fileId }) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const transactions = await db_default.queryAll`
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
        await db_default.exec`
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
      skipped
    };
  }
);
async function categorizeSingleTransaction(orgId, merchant, amount, description) {
  const normalizedMerchant = merchant.toLowerCase().trim();
  const existingRule = await db_default.queryRow`
    SELECT category, confidence
    FROM categorization_rules
    WHERE organization_id = ${orgId}
      AND ${normalizedMerchant} ILIKE '%' || merchant_pattern || '%'
    ORDER BY priority DESC, confidence DESC
    LIMIT 1
  `;
  if (existingRule) {
    await db_default.exec`
      UPDATE categorization_rules
      SET usage_count = usage_count + 1
      WHERE organization_id = ${orgId}
        AND category = ${existingRule.category}
    `;
    return {
      category: existingRule.category,
      confidence: existingRule.confidence,
      explanation: `Matched rule for merchant pattern`,
      modelVersion: "rule-based-v1"
    };
  }
  const similarMerchant = await db_default.queryRow`
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
      modelVersion: "merchant-match-v1"
    };
  }
  const categoryGuess = guessCategoryFromMerchant(normalizedMerchant, amount);
  if (categoryGuess) {
    return {
      category: categoryGuess.category,
      confidence: categoryGuess.confidence,
      explanation: categoryGuess.explanation,
      modelVersion: "heuristic-v1"
    };
  }
  return null;
}
function guessCategoryFromMerchant(merchant, amount) {
  const patterns = [
    { keywords: ["zomato", "swiggy", "uber eats", "food", "restaurant", "cafe"], category: "Food & Dining", confidence: 0.9 },
    { keywords: ["amazon", "flipkart", "myntra", "shopping", "store"], category: "Shopping", confidence: 0.85 },
    { keywords: ["uber", "ola", "taxi", "transport", "metro", "bus"], category: "Transportation", confidence: 0.9 },
    { keywords: ["netflix", "spotify", "prime", "subscription"], category: "Entertainment", confidence: 0.95 },
    { keywords: ["electricity", "water", "gas", "utility", "bill"], category: "Utilities", confidence: 0.9 },
    { keywords: ["rent", "lease", "housing"], category: "Housing", confidence: 0.95 },
    { keywords: ["hospital", "clinic", "pharmacy", "medical", "health"], category: "Healthcare", confidence: 0.9 },
    { keywords: ["gym", "fitness", "yoga"], category: "Fitness", confidence: 0.9 }
  ];
  for (const pattern of patterns) {
    if (pattern.keywords.some((kw) => merchant.includes(kw))) {
      return {
        category: pattern.category,
        confidence: pattern.confidence,
        explanation: `Merchant name contains keywords related to ${pattern.category}`
      };
    }
  }
  return null;
}

// ai/detect_anomalies.ts
import { api as api3 } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
async function detectAnomaliesForOrg(orgId) {
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
  const dailySpending = await db_default.queryAll`
    SELECT 
      DATE(date) as date,
      SUM(amount) as total
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${last30Days}
      AND amount > 0
    GROUP BY DATE(date)
    ORDER BY date
  `;
  if (dailySpending.length < 7) {
    return 0;
  }
  const amounts = dailySpending.map((d) => d.total);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(
    amounts.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length
  );
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
  const deviations = amounts.map((x) => Math.abs(x - median));
  const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)] * 1.4826;
  let anomaliesDetected = 0;
  for (const day of dailySpending) {
    const zScore = stdDev > 0 ? Math.abs((day.total - mean) / stdDev) : 0;
    const madScore = mad > 0 ? Math.abs((day.total - median) / mad) : 0;
    let severity = null;
    let type = "high_spending";
    if (zScore > 3 || madScore > 3.5) {
      severity = "high";
    } else if (zScore > 2.5 || madScore > 3) {
      severity = "medium";
    } else if (zScore > 2 || madScore > 2.5) {
      severity = "low";
    }
    if (severity) {
      const existing = await db_default.queryRow`
        SELECT id FROM anomalies
        WHERE organization_id = ${orgId}
          AND date = ${day.date}
      `;
      if (!existing) {
        await db_default.exec`
          INSERT INTO anomalies (
            organization_id, date, amount, z_score, mad_score, type, severity
          )
          VALUES (
            ${orgId}, ${day.date}, ${day.total}, ${zScore}, ${madScore}, ${type}, ${severity}
          )
        `;
        anomaliesDetected++;
      }
    }
  }
  return anomaliesDetected;
}
var detectAnomalies = api3(
  { auth: false, expose: false, method: "POST", path: "/ai/detect-anomalies" },
  async () => {
    const orgs = await db_default.queryAll`
      SELECT DISTINCT organization_id as id
      FROM transactions
      WHERE date >= NOW() - INTERVAL '30 days'
    `;
    let totalDetected = 0;
    for (const org of orgs) {
      const detected = await detectAnomaliesForOrg(org.id);
      totalDetected += detected;
    }
    return {
      detected: totalDetected,
      organizations: orgs.length
    };
  }
);
var detectAnomaliesCron = api3(
  { auth: false, expose: false, method: "POST", path: "/ai/detect-anomalies-cron" },
  async () => {
    return await detectAnomalies({});
  }
);
var _ = new CronJob("anomaly-detection", {
  title: "Detect spending anomalies",
  schedule: "0 2 * * *",
  endpoint: detectAnomaliesCron
});
var getAnomalies = api3(
  { auth: true, expose: true, method: "GET", path: "/ai/anomalies" },
  async () => {
    const { getAuthData: getAuthData2 } = await Promise.resolve().then(() => (init_auth2(), auth_exports));
    const authData = getAuthData2();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const anomalies = await db_default.queryAll`
      SELECT 
        id, date, amount, 
        z_score, mad_score,
        type, severity, acknowledged
      FROM anomalies
      WHERE organization_id = ${orgId}
      ORDER BY date DESC
      LIMIT 30
    `;
    return {
      anomalies: anomalies.map((a) => ({
        id: a.id,
        date: a.date,
        amount: a.amount,
        zScore: a.z_score,
        madScore: a.mad_score,
        type: a.type,
        severity: a.severity,
        acknowledged: a.acknowledged
      }))
    };
  }
);
var acknowledgeAnomaly = api3(
  { auth: true, expose: true, method: "POST", path: "/ai/anomalies/:anomalyId/acknowledge" },
  async ({ anomalyId }) => {
    const { getAuthData: getAuthData2 } = await Promise.resolve().then(() => (init_auth2(), auth_exports));
    const authData = getAuthData2();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    await db_default.exec`
      UPDATE anomalies
      SET acknowledged = true
      WHERE id = ${anomalyId} AND organization_id = ${orgId}
    `;
    return { success: true };
  }
);

// ai/get_settings.ts
init_auth2();
import { api as api4 } from "encore.dev/api";
var getSettings = api4(
  { auth: true, expose: true, method: "GET", path: "/ai/settings" },
  async () => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const settings = await db_default.queryRow`
      SELECT 
        ai_insights_enabled as "aiInsightsEnabled",
        ai_categorization_enabled as "aiCategorizationEnabled",
        share_merchant_names as "shareMerchantNames",
        privacy_mode as "privacyMode"
      FROM user_settings
      WHERE user_id = ${authData.userID}
    `;
    if (!settings) {
      await db_default.exec`
        INSERT INTO user_settings (user_id, organization_id)
        VALUES (${authData.userID}, ${orgId})
      `;
      return {
        aiInsightsEnabled: true,
        aiCategorizationEnabled: true,
        shareMerchantNames: true,
        privacyMode: false
      };
    }
    return settings;
  }
);
var updateSettings = api4(
  { auth: true, expose: true, method: "PUT", path: "/ai/settings" },
  async (params) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const updates = [];
    const values = [];
    if (params.aiInsightsEnabled !== void 0) {
      updates.push("ai_insights_enabled = $" + (values.length + 1));
      values.push(params.aiInsightsEnabled);
    }
    if (params.aiCategorizationEnabled !== void 0) {
      updates.push("ai_categorization_enabled = $" + (values.length + 1));
      values.push(params.aiCategorizationEnabled);
    }
    if (params.shareMerchantNames !== void 0) {
      updates.push("share_merchant_names = $" + (values.length + 1));
      values.push(params.shareMerchantNames);
    }
    if (params.privacyMode !== void 0) {
      updates.push("privacy_mode = $" + (values.length + 1));
      values.push(params.privacyMode);
    }
    if (updates.length > 0) {
      const query = `
        UPDATE user_settings
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE user_id = $${values.length + 1}
      `;
      await db_default.rawExec(query, ...values, authData.userID);
    }
    return await getSettings({});
  }
);

// ai/insights.ts
init_auth2();
import { api as api5 } from "encore.dev/api";
var getInsights = api5(
  { auth: true, expose: true, method: "GET", path: "/ai/insights" },
  async ({ periodStart, periodEnd }) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const settings = await db_default.queryRow`
      SELECT ai_insights_enabled
      FROM user_settings
      WHERE user_id = ${authData.userID}
    `;
    if (settings && !settings.ai_insights_enabled) {
      return {
        bullets: [],
        summary: "AI insights are disabled. Enable them in Settings to see personalized insights.",
        periodStart: periodStart || "",
        periodEnd: periodEnd || ""
      };
    }
    const start = periodStart || new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1).toISOString();
    const end = periodEnd || (/* @__PURE__ */ new Date()).toISOString();
    const cached = await db_default.queryRow`
      SELECT bullets, summary
      FROM insights
      WHERE organization_id = ${orgId}
        AND period_start = ${start}
        AND period_end = ${end}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (cached) {
      return {
        bullets: cached.bullets,
        summary: cached.summary,
        periodStart: start,
        periodEnd: end
      };
    }
    const insights = await generateInsights(orgId, start, end);
    await db_default.exec`
      INSERT INTO insights (organization_id, period_start, period_end, bullets, summary)
      VALUES (${orgId}, ${start}, ${end}, ${JSON.stringify(insights.bullets)}, ${insights.summary})
    `;
    return {
      ...insights,
      periodStart: start,
      periodEnd: end
    };
  }
);
async function generateInsights(orgId, start, end) {
  const currentPeriodStats = await db_default.queryRow`
    SELECT 
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) / GREATEST(EXTRACT(DAY FROM (${end}::timestamp - ${start}::timestamp)), 1) as avg_daily
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${start}
      AND date <= ${end}
      AND amount > 0
  `;
  const prevStart = new Date(new Date(start).getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString();
  const prevEnd = start;
  const prevPeriodStats = await db_default.queryRow`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${prevStart}
      AND date < ${prevEnd}
      AND amount > 0
  `;
  const topCategories = await db_default.queryAll`
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      SUM(amount) as total
    FROM transactions
    WHERE organization_id = ${orgId}
      AND date >= ${start}
      AND date <= ${end}
      AND amount > 0
    GROUP BY category
    ORDER BY total DESC
    LIMIT 3
  `;
  const anomalies = await db_default.queryAll`
    SELECT date, amount, severity
    FROM anomalies
    WHERE organization_id = ${orgId}
      AND date >= ${start}
      AND date <= ${end}
      AND acknowledged = false
    ORDER BY date DESC
    LIMIT 3
  `;
  const bullets = [];
  const momChange = prevPeriodStats && prevPeriodStats.total > 0 ? (currentPeriodStats.total - prevPeriodStats.total) / prevPeriodStats.total * 100 : 0;
  if (Math.abs(momChange) > 10) {
    bullets.push({
      text: `Spending ${momChange > 0 ? "increased" : "decreased"} by ${Math.abs(momChange).toFixed(1)}% vs last period`,
      type: momChange > 20 ? "warning" : momChange < -10 ? "success" : "info"
    });
  }
  if (topCategories.length > 0) {
    bullets.push({
      text: `Top spending: ${topCategories[0].category} (₹${topCategories[0].total.toFixed(0)})`,
      type: "info",
      link: `/transactions?category=${topCategories[0].category}`
    });
  }
  if (anomalies.length > 0) {
    bullets.push({
      text: `${anomalies.length} unusual spending ${anomalies.length === 1 ? "day" : "days"} detected`,
      type: "warning"
    });
  }
  if (currentPeriodStats.avg_daily > 0) {
    bullets.push({
      text: `Average daily spend: ₹${currentPeriodStats.avg_daily.toFixed(0)}`,
      type: "info"
    });
  }
  const summary = `This period you spent ₹${currentPeriodStats.total.toFixed(0)} across ${currentPeriodStats.count} transactions. ${momChange > 10 ? `Spending increased by ${momChange.toFixed(1)}% compared to last month, primarily driven by ${topCategories[0]?.category || "various categories"}.` : momChange < -10 ? `Great job! Spending decreased by ${Math.abs(momChange).toFixed(1)}% compared to last month.` : "Spending remained relatively stable compared to last month."}${anomalies.length > 0 ? ` We detected ${anomalies.length} unusual spending patterns that may need your attention.` : ""}`;
  return { bullets, summary };
}

// auth/clerk_webhook.ts
import { api as api6 } from "encore.dev/api";
import { secret as secret2 } from "encore.dev/config";
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = secret2("SupabaseURL");
var supabaseServiceKey = secret2("SupabaseServiceKey");
var clerkWebhook = api6(
  { auth: false, expose: true, method: "POST", path: "/webhooks/clerk", bodyLimit: 5 * 1024 * 1024 },
  async (event) => {
    const supabase = createClient(supabaseUrl(), supabaseServiceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    if (event.type === "user.created" || event.type === "user.updated") {
      const clerkUserId = event.data.id;
      const email = event.data.email_addresses[0]?.email_address;
      const name = event.data.first_name && event.data.last_name ? `${event.data.first_name} ${event.data.last_name}` : event.data.first_name || event.data.last_name || null;
      const imageUrl = event.data.image_url;
      if (!email) {
        console.error("No email found for user", clerkUserId);
        return { success: false };
      }
      const { data: existingUser } = await supabase.auth.admin.getUserById(clerkUserId);
      if (existingUser.user) {
        await supabase.auth.admin.updateUserById(clerkUserId, {
          email,
          user_metadata: {
            name,
            image: imageUrl
          }
        });
      } else {
        const { error } = await supabase.auth.admin.createUser({
          id: clerkUserId,
          email,
          email_confirm: true,
          user_metadata: {
            name,
            image: imageUrl
          }
        });
        if (error) {
          console.error("Error creating user in Supabase:", error);
          return { success: false };
        }
      }
      return { success: true };
    }
    if (event.type === "user.deleted") {
      const clerkUserId = event.data.id;
      const { error } = await supabase.auth.admin.deleteUser(clerkUserId);
      if (error) {
        console.error("Error deleting user from Supabase:", error);
        return { success: false };
      }
      return { success: true };
    }
    return { success: true };
  }
);

// auth/user.ts
init_auth2();
import { api as api7 } from "encore.dev/api";
var getUserInfo = api7(
  { auth: true, expose: true, method: "GET", path: "/user/me" },
  async () => {
    const authData = getAuthData();
    return {
      id: authData.userID,
      email: authData.email,
      imageUrl: authData.imageUrl,
      organizationID: authData.organizationID
    };
  }
);

// budget/create.ts
init_auth2();
import { api as api8 } from "encore.dev/api";

// db/index.ts
import { SQLDatabase as SQLDatabase2 } from "encore.dev/storage/sqldb";
var db_default2 = new SQLDatabase2("db", {
  migrations: "./migrations"
  // This is a stub - the actual connection is managed in lib/db.ts
});

// budget/create.ts
var create = api8(
  { auth: true, expose: true, method: "POST", path: "/budgets" },
  async (params) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const result = await db_default2.queryRow`
      INSERT INTO budgets (category_id, amount, period_start, period_end, alert_threshold)
      VALUES (
        ${params.categoryId},
        ${params.amount},
        ${params.periodStart},
        ${params.periodEnd},
        ${params.alertThreshold || 0.8}
      )
      RETURNING
        id, category_id as "categoryId", amount,
        period_start as "periodStart", period_end as "periodEnd",
        alert_threshold as "alertThreshold"
    `;
    return result;
  }
);

// budget/list.ts
init_auth2();
import { api as api9 } from "encore.dev/api";
var list = api9(
  { auth: true, expose: true, method: "GET", path: "/budgets" },
  async () => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const budgets = await db_default2.queryAll`
      SELECT 
        b.id, b.category_id as "categoryId",
        c.name as "categoryName", c.color as "categoryColor",
        b.amount, b.period_start as "periodStart",
        b.period_end as "periodEnd", b.alert_threshold as "alertThreshold",
        COALESCE(SUM(t.amount), 0) as spent,
        CASE 
          WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount) * 100
          ELSE 0
        END as percentage
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = b.category_id
        AND t.date >= b.period_start AND t.date <= b.period_end
      WHERE b.period_end >= NOW()
      GROUP BY b.id, c.name, c.color
      ORDER BY b.period_start DESC
    `;
    return { budgets };
  }
);

// category/create.ts
init_auth2();
import { api as api10 } from "encore.dev/api";
var create2 = api10(
  { auth: true, expose: true, method: "POST", path: "/categories" },
  async (params) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const result = await db_default2.queryRow`
      INSERT INTO categories (name, color, icon, parent_id, is_system)
      VALUES (
        ${params.name},
        ${params.color || "#6EE7F9"},
        ${params.icon || null},
        ${params.parentId || null},
        false
      )
      RETURNING
        id, name, color, icon,
        parent_id as "parentId",
        is_system as "isSystem"
    `;
    return result;
  }
);

// category/list.ts
init_auth2();
import { api as api11 } from "encore.dev/api";
var list2 = api11(
  { auth: true, expose: true, method: "GET", path: "/categories" },
  async () => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const categories = await db_default2.queryAll`
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

// category/rules.ts
import { api as api12 } from "encore.dev/api";
var listRules = api12(
  { expose: true, method: "GET", path: "/categories/rules" },
  async () => {
    const rules = await db_default2.queryAll`
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
var createRule = api12(
  { expose: true, method: "POST", path: "/categories/rules" },
  async (params) => {
    const result = await db_default2.queryRow`
      INSERT INTO category_rules (pattern, category_id, priority, confidence)
      VALUES (
        ${params.pattern},
        ${params.categoryId},
        ${params.priority || 0},
        ${params.confidence || 1}
      )
      RETURNING
        id, pattern, category_id as "categoryId",
        (SELECT name FROM categories WHERE id = category_id) as "categoryName",
        priority, confidence
    `;
    return result;
  }
);

// dashboard/stats.ts
init_auth2();
import { api as api13 } from "encore.dev/api";
var getStats = api13(
  { auth: true, expose: true, method: "GET", path: "/dashboard/stats" },
  async ({ startDate, endDate }) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const startStr = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
    const endStr = endDate || (/* @__PURE__ */ new Date()).toISOString();
    const totals = await db_default2.queryRow`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= ${startStr} AND date <= ${endStr} AND amount > 0
    `;
    const categoryBreakdown = await db_default2.queryAll`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        c.color as "categoryColor",
        COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.date >= ${startStr} AND t.date <= ${endStr} AND t.amount > 0
      GROUP BY c.id, c.name, c.color
      HAVING COALESCE(SUM(t.amount), 0) > 0
      ORDER BY total DESC
    `;
    const dailySpend = await db_default2.queryAll`
      SELECT 
        DATE(date) as date,
        SUM(amount) as total
      FROM transactions
      WHERE date >= ${startStr} AND date <= ${endStr} AND amount > 0
      GROUP BY DATE(date)
      ORDER BY date
    `;
    const topMerchants = await db_default2.queryAll`
      SELECT 
        merchant,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE date >= ${startStr} AND date <= ${endStr} AND amount > 0
      GROUP BY merchant
      ORDER BY total DESC
      LIMIT 10
    `;
    const days = Math.ceil((new Date(endStr).getTime() - new Date(startStr).getTime()) / (1e3 * 60 * 60 * 24)) || 1;
    return {
      totalSpend: totals?.total || 0,
      transactionCount: totals?.count || 0,
      avgPerDay: (totals?.total || 0) / days,
      topCategory: categoryBreakdown[0] || null,
      categoryBreakdown,
      dailySpend,
      topMerchants
    };
  }
);

// transaction/create.ts
init_auth2();
import { api as api14 } from "encore.dev/api";
var create3 = api14(
  { auth: true, expose: true, method: "POST", path: "/transactions" },
  async (params) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    const result = await db_default2.queryRow`
      INSERT INTO transactions (
        date, amount, merchant, description, category_id, currency,
        payment_method, tags, notes, is_recurring
      )
      VALUES (
        ${params.date}, ${params.amount}, ${params.merchant},
        ${params.description || null}, ${params.categoryId || null},
        ${params.currency || "INR"}, ${params.paymentMethod || null},
        ${params.tags || []}, ${params.notes || null},
        ${params.isRecurring || false}
      )
      RETURNING
        id, date, amount, merchant, description,
        category_id as "categoryId", currency,
        payment_method as "paymentMethod", tags, notes,
        is_recurring as "isRecurring"
    `;
    return result;
  }
);

// transaction/delete.ts
import { api as api15 } from "encore.dev/api";
var deleteTransaction = api15(
  { expose: true, method: "DELETE", path: "/transactions/:id" },
  async ({ id }) => {
    await db_default2.exec`DELETE FROM transactions WHERE id = ${id}`;
  }
);

// transaction/list.ts
init_auth2();
import { api as api16 } from "encore.dev/api";
var list3 = api16(
  { auth: true, expose: true, method: "GET", path: "/transactions" },
  async ({ limit, offset, categoryId, startDate, endDate, search }) => {
    const authData = getAuthData();
    const orgId = authData.organizationID;
    if (!orgId)
      throw new Error("Organization ID required");
    let whereClause = "WHERE 1=1";
    const params = [];
    if (categoryId) {
      whereClause += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    if (startDate) {
      whereClause += ` AND t.date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ` AND t.date <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (search) {
      const paramNum = params.length + 1;
      whereClause += ` AND (t.merchant ILIKE $${paramNum} OR t.description ILIKE $${paramNum})`;
      params.push(`%${search}%`);
    }
    const query = `
      SELECT 
        t.id, t.date, t.amount, t.merchant, t.description,
        t.category_id as "categoryId", c.name as "categoryName", c.color as "categoryColor",
        t.currency, t.payment_method as "paymentMethod", t.tags, t.notes, t.is_recurring as "isRecurring"
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      ${whereClause}
    `;
    const transactions = await db_default2.rawQueryAll(query, ...params, limit || 50, offset || 0);
    const totalResult = await db_default2.rawQueryRow(countQuery, ...params);
    return {
      transactions,
      total: totalResult?.total || 0
    };
  }
);

// transaction/update.ts
import { api as api17, APIError as APIError2 } from "encore.dev/api";
var update = api17(
  { expose: true, method: "PUT", path: "/transactions/:id" },
  async (params) => {
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (params.date !== void 0) {
      updates.push(`date = $${paramCount++}`);
      values.push(params.date);
    }
    if (params.amount !== void 0) {
      updates.push(`amount = $${paramCount++}`);
      values.push(params.amount);
    }
    if (params.merchant !== void 0) {
      updates.push(`merchant = $${paramCount++}`);
      values.push(params.merchant);
    }
    if (params.description !== void 0) {
      updates.push(`description = $${paramCount++}`);
      values.push(params.description);
    }
    if (params.categoryId !== void 0) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(params.categoryId);
    }
    if (params.currency !== void 0) {
      updates.push(`currency = $${paramCount++}`);
      values.push(params.currency);
    }
    if (params.paymentMethod !== void 0) {
      updates.push(`payment_method = $${paramCount++}`);
      values.push(params.paymentMethod);
    }
    if (params.tags !== void 0) {
      updates.push(`tags = $${paramCount++}`);
      values.push(params.tags);
    }
    if (params.notes !== void 0) {
      updates.push(`notes = $${paramCount++}`);
      values.push(params.notes);
    }
    if (params.isRecurring !== void 0) {
      updates.push(`is_recurring = $${paramCount++}`);
      values.push(params.isRecurring);
    }
    updates.push(`updated_at = NOW()`);
    const query = `
      UPDATE transactions
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING
        id, date, amount, merchant, description,
        category_id as "categoryId", currency,
        payment_method as "paymentMethod", tags, notes,
        is_recurring as "isRecurring"
    `;
    const result = await db_default2.rawQueryRow(query, ...values, params.id);
    if (!result) {
      throw APIError2.notFound("transaction not found");
    }
    return result;
  }
);

// upload/upload.ts
import { api as api18 } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";
var uploadsBucket = new Bucket("uploads", { public: false });
var getUploadUrl = api18(
  { expose: true, method: "POST", path: "/upload/url" },
  async ({ filename }) => {
    const uploadId = await db_default2.queryRow`
      INSERT INTO uploads (filename, status)
      VALUES (${filename}, 'pending')
      RETURNING id
    `;
    const objectName = `${uploadId.id}/${filename}`;
    const { url } = await uploadsBucket.signedUploadUrl(objectName, { ttl: 3600 });
    return {
      uploadId: uploadId.id,
      signedUrl: url
    };
  }
);
var processUpload = api18(
  { expose: true, method: "POST", path: "/upload/:uploadId/process" },
  async ({ uploadId }) => {
    const upload = await db_default2.queryRow`
      SELECT filename FROM uploads WHERE id = ${uploadId}
    `;
    if (!upload) {
      throw new Error("Upload not found");
    }
    const objectName = `${uploadId}/${upload.filename}`;
    const fileData = await uploadsBucket.download(objectName);
    const rows = parseCSV(fileData.toString());
    const errors = [];
    let successCount = 0;
    for (const row of rows) {
      try {
        await db_default2.exec`
          INSERT INTO transactions (date, amount, merchant, description, currency)
          VALUES (${row.date}, ${row.amount}, ${row.merchant}, ${row.description || ""}, ${row.currency || "INR"})
        `;
        successCount++;
      } catch (err) {
        errors.push(`Row ${successCount + errors.length + 1}: ${err}`);
      }
    }
    await db_default2.exec`
      UPDATE uploads
      SET status = 'processed', processed_at = NOW(), total_rows = ${successCount}, errors = ${JSON.stringify(errors)}
      WHERE id = ${uploadId}
    `;
    return {
      success: errors.length === 0,
      totalRows: successCount,
      errors: errors.length > 0 ? errors : void 0
    };
  }
);
function parseCSV(content) {
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const amountIdx = headers.findIndex((h) => h.includes("amount"));
  const merchantIdx = headers.findIndex((h) => h.includes("merchant") || h.includes("vendor") || h.includes("payee"));
  const descIdx = headers.findIndex((h) => h.includes("description") || h.includes("memo"));
  const currencyIdx = headers.findIndex((h) => h.includes("currency"));
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      date: new Date(cols[dateIdx]),
      amount: parseFloat(cols[amountIdx]),
      merchant: cols[merchantIdx] || "Unknown",
      description: descIdx >= 0 ? cols[descIdx] : void 0,
      currency: currencyIdx >= 0 ? cols[currencyIdx] : void 0
    };
  });
}

// budget/encore.service.ts
import { Service } from "encore.dev/service";
var encore_service_default = new Service("budget");

// transaction/encore.service.ts
import { Service as Service2 } from "encore.dev/service";
var encore_service_default2 = new Service2("transaction");

// ai/encore.service.ts
import { Service as Service3 } from "encore.dev/service";
var encore_service_default3 = new Service3("ai");

// auth/encore.service.ts
import { Service as Service4 } from "encore.dev/service";
var encore_service_default4 = new Service4("auth");

// dashboard/encore.service.ts
import { Service as Service5 } from "encore.dev/service";
var encore_service_default5 = new Service5("dashboard");

// category/encore.service.ts
import { Service as Service6 } from "encore.dev/service";
var encore_service_default6 = new Service6("category");

// upload/encore.service.ts
import { Service as Service7 } from "encore.dev/service";
var encore_service_default7 = new Service7("upload");

// encore.gen/internal/entrypoints/combined/main.ts
var gateways = [
  gw
];
var handlers = [
  {
    apiRoute: {
      service: "ai",
      name: "applySuggestion",
      handler: applySuggestion,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "categorizeBatch",
      handler: categorizeBatch,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "detectAnomalies",
      handler: detectAnomalies,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": false, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "detectAnomaliesCron",
      handler: detectAnomaliesCron,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": false, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "getAnomalies",
      handler: getAnomalies,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "acknowledgeAnomaly",
      handler: acknowledgeAnomaly,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "getSettings",
      handler: getSettings,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "updateSettings",
      handler: updateSettings,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "ai",
      name: "getInsights",
      handler: getInsights,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default3.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "auth",
      name: "clerkWebhook",
      handler: clerkWebhook,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default4.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "auth",
      name: "getUserInfo",
      handler: getUserInfo,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default4.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "budget",
      name: "create",
      handler: create,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "budget",
      name: "list",
      handler: list,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "category",
      name: "create",
      handler: create2,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default6.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "category",
      name: "list",
      handler: list2,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default6.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "category",
      name: "listRules",
      handler: listRules,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default6.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "category",
      name: "createRule",
      handler: createRule,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default6.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "dashboard",
      name: "getStats",
      handler: getStats,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default5.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "transaction",
      name: "create",
      handler: create3,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default2.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "transaction",
      name: "deleteTransaction",
      handler: deleteTransaction,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default2.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "transaction",
      name: "list",
      handler: list3,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": true, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default2.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "transaction",
      name: "update",
      handler: update,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default2.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "upload",
      name: "getUploadUrl",
      handler: getUploadUrl,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default7.cfg.middlewares || []
  },
  {
    apiRoute: {
      service: "upload",
      name: "processUpload",
      handler: processUpload,
      raw: false,
      streamingRequest: false,
      streamingResponse: false
    },
    endpointOptions: { "expose": true, "auth": false, "isRaw": false, "isStream": false, "tags": [] },
    middlewares: encore_service_default7.cfg.middlewares || []
  }
];
registerGateways(gateways);
registerHandlers(handlers);
await run(import.meta.url);
//# sourceMappingURL=main.mjs.map
