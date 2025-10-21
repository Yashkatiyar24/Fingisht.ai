import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../external_dbs/postgres/db";

interface UserSettings {
  aiInsightsEnabled: boolean;
  aiCategorizationEnabled: boolean;
  shareMerchantNames: boolean;
  privacyMode: boolean;
}

export const getSettings = api<{}, UserSettings>(
  { auth: true, expose: true, method: "GET", path: "/ai/settings" },
  async () => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    const settings = await db.queryRow<UserSettings>`
      SELECT 
        ai_insights_enabled as "aiInsightsEnabled",
        ai_categorization_enabled as "aiCategorizationEnabled",
        share_merchant_names as "shareMerchantNames",
        privacy_mode as "privacyMode"
      FROM user_settings
      WHERE user_id = ${authData.userID}
    `;

    if (!settings) {
      await db.exec`
        INSERT INTO user_settings (user_id, organization_id)
        VALUES (${authData.userID}, ${orgId})
      `;

      return {
        aiInsightsEnabled: true,
        aiCategorizationEnabled: true,
        shareMerchantNames: true,
        privacyMode: false,
      };
    }

    return settings;
  }
);

interface UpdateSettingsParams {
  aiInsightsEnabled?: boolean;
  aiCategorizationEnabled?: boolean;
  shareMerchantNames?: boolean;
  privacyMode?: boolean;
}

export const updateSettings = api<UpdateSettingsParams, UserSettings>(
  { auth: true, expose: true, method: "PUT", path: "/ai/settings" },
  async (params) => {
    const authData = getAuthData()!;
    const orgId = authData.organizationID;
    if (!orgId) throw new Error("Organization ID required");

    const updates: string[] = [];
    const values: any[] = [];

    if (params.aiInsightsEnabled !== undefined) {
      updates.push("ai_insights_enabled = $" + (values.length + 1));
      values.push(params.aiInsightsEnabled);
    }
    if (params.aiCategorizationEnabled !== undefined) {
      updates.push("ai_categorization_enabled = $" + (values.length + 1));
      values.push(params.aiCategorizationEnabled);
    }
    if (params.shareMerchantNames !== undefined) {
      updates.push("share_merchant_names = $" + (values.length + 1));
      values.push(params.shareMerchantNames);
    }
    if (params.privacyMode !== undefined) {
      updates.push("privacy_mode = $" + (values.length + 1));
      values.push(params.privacyMode);
    }

    if (updates.length > 0) {
      const query = `
        UPDATE user_settings
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE user_id = $${values.length + 1}
      `;
      await db.rawExec(query, ...values, authData.userID);
    }

    return await getSettings({});
  }
);
