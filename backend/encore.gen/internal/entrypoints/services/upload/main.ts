import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { getUploadUrl as getUploadUrlImpl0 } from "../../../../../upload/upload";
import { processUpload as processUploadImpl1 } from "../../../../../upload/upload";
import * as upload_service from "../../../../../upload/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "upload",
            name:              "getUploadUrl",
            handler:           getUploadUrlImpl0,
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
            handler:           processUploadImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: upload_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
