import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { create as createImpl0 } from "../../../../../transaction/create";
import { deleteTransaction as deleteTransactionImpl1 } from "../../../../../transaction/delete";
import { list as listImpl2 } from "../../../../../transaction/list";
import { update as updateImpl3 } from "../../../../../transaction/update";
import * as transaction_service from "../../../../../transaction/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "transaction",
            name:              "create",
            handler:           createImpl0,
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
            handler:           deleteTransactionImpl1,
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
            handler:           listImpl2,
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
            handler:           updateImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: transaction_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
