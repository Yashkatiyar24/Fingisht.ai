import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { getUploadUrl as getUploadUrl_handler } from "../../../../upload/upload.js";
declare const getUploadUrl: WithCallOpts<typeof getUploadUrl_handler>;
export { getUploadUrl };

import { processUpload as processUpload_handler } from "../../../../upload/upload.js";
declare const processUpload: WithCallOpts<typeof processUpload_handler>;
export { processUpload };


