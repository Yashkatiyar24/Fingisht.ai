import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { gw as api_gatewayGW } from "../../../../auth/auth";
import { applySuggestion as ai_applySuggestionImpl0 } from "../../../../ai/apply_suggestion";
import { categorizeBatch as ai_categorizeBatchImpl1 } from "../../../../ai/categorize_batch";
import { detectAnomalies as ai_detectAnomaliesImpl2 } from "../../../../ai/detect_anomalies";
import { detectAnomaliesCron as ai_detectAnomaliesCronImpl3 } from "../../../../ai/detect_anomalies";
import { getAnomalies as ai_getAnomaliesImpl4 } from "../../../../ai/detect_anomalies";
import { acknowledgeAnomaly as ai_acknowledgeAnomalyImpl5 } from "../../../../ai/detect_anomalies";
import { getSettings as ai_getSettingsImpl6 } from "../../../../ai/get_settings";
import { updateSettings as ai_updateSettingsImpl7 } from "../../../../ai/get_settings";
import { getInsights as ai_getInsightsImpl8 } from "../../../../ai/insights";
import { clerkWebhook as auth_clerkWebhookImpl9 } from "../../../../auth/clerk_webhook";
import { getUserInfo as auth_getUserInfoImpl10 } from "../../../../auth/user";
import { create as budget_createImpl11 } from "../../../../budget/create";
import { list as budget_listImpl12 } from "../../../../budget/list";
import { create as category_createImpl13 } from "../../../../category/create";
import { list as category_listImpl14 } from "../../../../category/list";
import { listRules as category_listRulesImpl15 } from "../../../../category/rules";
import { createRule as category_createRuleImpl16 } from "../../../../category/rules";
import { getStats as dashboard_getStatsImpl17 } from "../../../../dashboard/stats";
import { create as transaction_createImpl18 } from "../../../../transaction/create";
import { deleteTransaction as transaction_deleteTransactionImpl19 } from "../../../../transaction/delete";
import { list as transaction_listImpl20 } from "../../../../transaction/list";
import { update as transaction_updateImpl21 } from "../../../../transaction/update";
import { getUploadUrl as upload_getUploadUrlImpl22 } from "../../../../upload/upload";
import { processUpload as upload_processUploadImpl23 } from "../../../../upload/upload";
import * as budget_service from "../../../../budget/encore.service";
import * as transaction_service from "../../../../transaction/encore.service";
import * as ai_service from "../../../../ai/encore.service";
import * as auth_service from "../../../../auth/encore.service";
import * as frontend_service from "../../../../frontend/encore.service";
import * as dashboard_service from "../../../../dashboard/encore.service";
import * as category_service from "../../../../category/encore.service";
import * as upload_service from "../../../../upload/encore.service";

const gateways: any[] = [
    api_gatewayGW,
];

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "ai",
            name:              "applySuggestion",
            handler:           ai_applySuggestionImpl0,
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
            handler:           ai_categorizeBatchImpl1,
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
            handler:           ai_detectAnomaliesImpl2,
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
            handler:           ai_detectAnomaliesCronImpl3,
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
            handler:           ai_getAnomaliesImpl4,
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
            handler:           ai_acknowledgeAnomalyImpl5,
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
            handler:           ai_getSettingsImpl6,
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
            handler:           ai_updateSettingsImpl7,
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
            handler:           ai_getInsightsImpl8,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: ai_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "auth",
            name:              "clerkWebhook",
            handler:           auth_clerkWebhookImpl9,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: auth_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "auth",
            name:              "getUserInfo",
            handler:           auth_getUserInfoImpl10,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: auth_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "budget",
            name:              "create",
            handler:           budget_createImpl11,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: budget_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "budget",
            name:              "list",
            handler:           budget_listImpl12,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: budget_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "category",
            name:              "create",
            handler:           category_createImpl13,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: category_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "category",
            name:              "list",
            handler:           category_listImpl14,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: category_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "category",
            name:              "listRules",
            handler:           category_listRulesImpl15,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: category_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "category",
            name:              "createRule",
            handler:           category_createRuleImpl16,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: category_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "dashboard",
            name:              "getStats",
            handler:           dashboard_getStatsImpl17,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: dashboard_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "transaction",
            name:              "create",
            handler:           transaction_createImpl18,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: transaction_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "transaction",
            name:              "deleteTransaction",
            handler:           transaction_deleteTransactionImpl19,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: transaction_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "transaction",
            name:              "list",
            handler:           transaction_listImpl20,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: transaction_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "transaction",
            name:              "update",
            handler:           transaction_updateImpl21,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: transaction_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "upload",
            name:              "getUploadUrl",
            handler:           upload_getUploadUrlImpl22,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: upload_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "upload",
            name:              "processUpload",
            handler:           upload_processUploadImpl23,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: upload_service.default.cfg.middlewares || [],
    },
];

registerGateways(gateways);
registerHandlers(handlers);

await run(import.meta.url);
