import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";

const TEST_ENDPOINTS = typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test"
    ? await import("./endpoints_testing.js")
    : null;

export async function applySuggestion(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.applySuggestion(params, opts);
    }

    return apiCall("ai", "applySuggestion", params, opts);
}
export async function categorizeBatch(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.categorizeBatch(params, opts);
    }

    return apiCall("ai", "categorizeBatch", params, opts);
}
export async function detectAnomalies(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.detectAnomalies(params, opts);
    }

    return apiCall("ai", "detectAnomalies", params, opts);
}
export async function detectAnomaliesCron(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.detectAnomaliesCron(params, opts);
    }

    return apiCall("ai", "detectAnomaliesCron", params, opts);
}
export async function getAnomalies(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getAnomalies(params, opts);
    }

    return apiCall("ai", "getAnomalies", params, opts);
}
export async function acknowledgeAnomaly(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.acknowledgeAnomaly(params, opts);
    }

    return apiCall("ai", "acknowledgeAnomaly", params, opts);
}
export async function getSettings(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getSettings(params, opts);
    }

    return apiCall("ai", "getSettings", params, opts);
}
export async function updateSettings(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.updateSettings(params, opts);
    }

    return apiCall("ai", "updateSettings", params, opts);
}
export async function getInsights(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getInsights(params, opts);
    }

    return apiCall("ai", "getInsights", params, opts);
}
