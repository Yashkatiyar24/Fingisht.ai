import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as ai_service from "../../../../ai/encore.service";

export async function applySuggestion(params, opts) {
    const handler = (await import("../../../../ai/apply_suggestion")).applySuggestion;
    registerTestHandler({
        apiRoute: { service: "ai", name: "applySuggestion", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "applySuggestion", params, opts);
}

export async function categorizeBatch(params, opts) {
    const handler = (await import("../../../../ai/categorize_batch")).categorizeBatch;
    registerTestHandler({
        apiRoute: { service: "ai", name: "categorizeBatch", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "categorizeBatch", params, opts);
}

export async function detectAnomalies(params, opts) {
    const handler = (await import("../../../../ai/detect_anomalies")).detectAnomalies;
    registerTestHandler({
        apiRoute: { service: "ai", name: "detectAnomalies", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":false,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "detectAnomalies", params, opts);
}

export async function detectAnomaliesCron(params, opts) {
    const handler = (await import("../../../../ai/detect_anomalies")).detectAnomaliesCron;
    registerTestHandler({
        apiRoute: { service: "ai", name: "detectAnomaliesCron", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":false,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "detectAnomaliesCron", params, opts);
}

export async function getAnomalies(params, opts) {
    const handler = (await import("../../../../ai/detect_anomalies")).getAnomalies;
    registerTestHandler({
        apiRoute: { service: "ai", name: "getAnomalies", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "getAnomalies", params, opts);
}

export async function acknowledgeAnomaly(params, opts) {
    const handler = (await import("../../../../ai/detect_anomalies")).acknowledgeAnomaly;
    registerTestHandler({
        apiRoute: { service: "ai", name: "acknowledgeAnomaly", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "acknowledgeAnomaly", params, opts);
}

export async function getSettings(params, opts) {
    const handler = (await import("../../../../ai/get_settings")).getSettings;
    registerTestHandler({
        apiRoute: { service: "ai", name: "getSettings", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "getSettings", params, opts);
}

export async function updateSettings(params, opts) {
    const handler = (await import("../../../../ai/get_settings")).updateSettings;
    registerTestHandler({
        apiRoute: { service: "ai", name: "updateSettings", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "updateSettings", params, opts);
}

export async function getInsights(params, opts) {
    const handler = (await import("../../../../ai/insights")).getInsights;
    registerTestHandler({
        apiRoute: { service: "ai", name: "getInsights", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: ai_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("ai", "getInsights", params, opts);
}

