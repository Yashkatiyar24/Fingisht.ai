import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as budget_service from "../../../../budget/encore.service";

export async function create(params, opts) {
    const handler = (await import("../../../../budget/create")).create;
    registerTestHandler({
        apiRoute: { service: "budget", name: "create", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: budget_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("budget", "create", params, opts);
}

export async function list(params, opts) {
    const handler = (await import("../../../../budget/list")).list;
    registerTestHandler({
        apiRoute: { service: "budget", name: "list", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: budget_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("budget", "list", params, opts);
}

