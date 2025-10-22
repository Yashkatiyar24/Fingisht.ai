import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as auth_service from "../../../../auth/encore.service";

export async function clerkWebhook(params, opts) {
    const handler = (await import("../../../../auth/clerk_webhook")).clerkWebhook;
    registerTestHandler({
        apiRoute: { service: "auth", name: "clerkWebhook", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: auth_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("auth", "clerkWebhook", params, opts);
}

export async function getUserInfo(params, opts) {
    const handler = (await import("../../../../auth/user")).getUserInfo;
    registerTestHandler({
        apiRoute: { service: "auth", name: "getUserInfo", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: auth_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("auth", "getUserInfo", params, opts);
}

