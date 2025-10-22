import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as dashboard_service from "../../../../dashboard/encore.service";

export async function getStats(params, opts) {
    const handler = (await import("../../../../dashboard/stats")).getStats;
    registerTestHandler({
        apiRoute: { service: "dashboard", name: "getStats", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: dashboard_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":true,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("dashboard", "getStats", params, opts);
}

