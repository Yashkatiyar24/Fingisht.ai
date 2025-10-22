import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as upload_service from "../../../../upload/encore.service";

export async function getUploadUrl(params, opts) {
    const handler = (await import("../../../../upload/upload")).getUploadUrl;
    registerTestHandler({
        apiRoute: { service: "upload", name: "getUploadUrl", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: upload_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("upload", "getUploadUrl", params, opts);
}

export async function processUpload(params, opts) {
    const handler = (await import("../../../../upload/upload")).processUpload;
    registerTestHandler({
        apiRoute: { service: "upload", name: "processUpload", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: upload_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("upload", "processUpload", params, opts);
}

