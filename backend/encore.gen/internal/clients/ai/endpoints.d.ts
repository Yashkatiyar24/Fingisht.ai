import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { applySuggestion as applySuggestion_handler } from "../../../../ai/apply_suggestion.js";
declare const applySuggestion: WithCallOpts<typeof applySuggestion_handler>;
export { applySuggestion };

import { categorizeBatch as categorizeBatch_handler } from "../../../../ai/categorize_batch.js";
declare const categorizeBatch: WithCallOpts<typeof categorizeBatch_handler>;
export { categorizeBatch };

import { detectAnomalies as detectAnomalies_handler } from "../../../../ai/detect_anomalies.js";
declare const detectAnomalies: WithCallOpts<typeof detectAnomalies_handler>;
export { detectAnomalies };

import { detectAnomaliesCron as detectAnomaliesCron_handler } from "../../../../ai/detect_anomalies.js";
declare const detectAnomaliesCron: WithCallOpts<typeof detectAnomaliesCron_handler>;
export { detectAnomaliesCron };

import { getAnomalies as getAnomalies_handler } from "../../../../ai/detect_anomalies.js";
declare const getAnomalies: WithCallOpts<typeof getAnomalies_handler>;
export { getAnomalies };

import { acknowledgeAnomaly as acknowledgeAnomaly_handler } from "../../../../ai/detect_anomalies.js";
declare const acknowledgeAnomaly: WithCallOpts<typeof acknowledgeAnomaly_handler>;
export { acknowledgeAnomaly };

import { getSettings as getSettings_handler } from "../../../../ai/get_settings.js";
declare const getSettings: WithCallOpts<typeof getSettings_handler>;
export { getSettings };

import { updateSettings as updateSettings_handler } from "../../../../ai/get_settings.js";
declare const updateSettings: WithCallOpts<typeof updateSettings_handler>;
export { updateSettings };

import { getInsights as getInsights_handler } from "../../../../ai/insights.js";
declare const getInsights: WithCallOpts<typeof getInsights_handler>;
export { getInsights };


