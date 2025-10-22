import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { applySuggestion as applySuggestionImpl0 } from "../../../../../ai/apply_suggestion";
import { categorizeBatch as categorizeBatchImpl1 } from "../../../../../ai/categorize_batch";
import { detectAnomalies as detectAnomaliesImpl2 } from "../../../../../ai/detect_anomalies";
import { detectAnomaliesCron as detectAnomaliesCronImpl3 } from "../../../../../ai/detect_anomalies";
import { getAnomalies as getAnomaliesImpl4 } from "../../../../../ai/detect_anomalies";
import { acknowledgeAnomaly as acknowledgeAnomalyImpl5 } from "../../../../../ai/detect_anomalies";
import { getSettings as getSettingsImpl6 } from "../../../../../ai/get_settings";
import { updateSettings as updateSettingsImpl7 } from "../../../../../ai/get_settings";
import { getInsights as getInsightsImpl8 } from "../../../../../ai/insights";
import * as ai_service from "../../../../../ai/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "ai",
            name:              "applySuggestion",
            handler:           applySuggestionImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "categorizeBatch",
            handler:           categorizeBatchImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "detectAnomalies",
            handler:           detectAnomaliesImpl2,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":false,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "detectAnomaliesCron",
            handler:           detectAnomaliesCronImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":false,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "getAnomalies",
            handler:           getAnomaliesImpl4,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "acknowledgeAnomaly",
            handler:           acknowledgeAnomalyImpl5,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "getSettings",
            handler:           getSettingsImpl6,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "updateSettings",
            handler:           updateSettingsImpl7,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "ai",
            name:              "getInsights",
            handler:           getInsightsImpl8,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
