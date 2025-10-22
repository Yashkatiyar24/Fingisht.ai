import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as transaction_service from "../../../../transaction/encore.service";

export async function create(params, opts) {
    const handler = (await import("../../../../transaction/create")).create;
    registerTestHandler({
        apiRoute: { service: "transaction", name: "create", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: transaction_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("transaction", "create", params, opts);
}

export async function deleteTransaction(params, opts) {
    const handler = (await import("../../../../transaction/delete")).deleteTransaction;
    registerTestHandler({
        apiRoute: { service: "transaction", name: "deleteTransaction", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: transaction_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("transaction", "deleteTransaction", params, opts);
}

export async function list(params, opts) {
    const handler = (await import("../../../../transaction/list")).list;
    registerTestHandler({
        apiRoute: { service: "transaction", name: "list", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: transaction_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("transaction", "list", params, opts);
}

export async function update(params, opts) {
    const handler = (await import("../../../../transaction/update")).update;
    registerTestHandler({
        apiRoute: { service: "transaction", name: "update", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: transaction_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("transaction", "update", params, opts);
}

