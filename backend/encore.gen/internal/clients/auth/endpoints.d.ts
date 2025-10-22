import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { clerkWebhook as clerkWebhook_handler } from "../../../../auth/clerk_webhook.js";
declare const clerkWebhook: WithCallOpts<typeof clerkWebhook_handler>;
export { clerkWebhook };

import { getUserInfo as getUserInfo_handler } from "../../../../auth/user.js";
declare const getUserInfo: WithCallOpts<typeof getUserInfo_handler>;
export { getUserInfo };


