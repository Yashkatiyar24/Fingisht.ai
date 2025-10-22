import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { getStats as getStatsImpl0 } from "../../../../../dashboard/stats";
import * as dashboard_service from "../../../../../dashboard/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "dashboard",
            name:              "getStats",
            handler:           getStatsImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: dashboard_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
