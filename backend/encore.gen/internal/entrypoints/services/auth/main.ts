import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { clerkWebhook as clerkWebhookImpl0 } from "../../../../../auth/clerk_webhook";
import { getUserInfo as getUserInfoImpl1 } from "../../../../../auth/user";
import * as auth_service from "../../../../../auth/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "auth",
            name:              "clerkWebhook",
            handler:           clerkWebhookImpl0,
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
            handler:           getUserInfoImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: auth_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
