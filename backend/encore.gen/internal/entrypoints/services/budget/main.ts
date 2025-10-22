import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { create as createImpl0 } from "../../../../../budget/create";
import { list as listImpl1 } from "../../../../../budget/list";
import * as budget_service from "../../../../../budget/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "budget",
            name:              "create",
            handler:           createImpl0,
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
            handler:           listImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: budget_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
