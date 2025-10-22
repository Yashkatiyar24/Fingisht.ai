import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as category_service from "../../../../category/encore.service";

export async function create(params, opts) {
    const handler = (await import("../../../../category/create")).create;
    registerTestHandler({
        apiRoute: { service: "category", name: "create", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: category_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("category", "create", params, opts);
}

export async function list(params, opts) {
    const handler = (await import("../../../../category/list")).list;
    registerTestHandler({
        apiRoute: { service: "category", name: "list", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: category_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("category", "list", params, opts);
}

export async function listRules(params, opts) {
    const handler = (await import("../../../../category/rules")).listRules;
    registerTestHandler({
        apiRoute: { service: "category", name: "listRules", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: category_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("category", "listRules", params, opts);
}

export async function createRule(params, opts) {
    const handler = (await import("../../../../category/rules")).createRule;
    registerTestHandler({
        apiRoute: { service: "category", name: "createRule", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: category_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("category", "createRule", params, opts);
}

