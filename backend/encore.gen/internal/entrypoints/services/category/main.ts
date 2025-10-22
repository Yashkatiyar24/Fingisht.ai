import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { create as createImpl0 } from "../../../../../category/create";
import { list as listImpl1 } from "../../../../../category/list";
import { listRules as listRulesImpl2 } from "../../../../../category/rules";
import { createRule as createRuleImpl3 } from "../../../../../category/rules";
import * as category_service from "../../../../../category/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "category",
            name:              "create",
            handler:           createImpl0,
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
            handler:           listImpl1,
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
            handler:           listRulesImpl2,
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
            handler:           createRuleImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: category_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
