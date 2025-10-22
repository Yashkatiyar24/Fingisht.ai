import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { create as create_handler } from "../../../../transaction/create.js";
declare const create: WithCallOpts<typeof create_handler>;
export { create };

import { deleteTransaction as deleteTransaction_handler } from "../../../../transaction/delete.js";
declare const deleteTransaction: WithCallOpts<typeof deleteTransaction_handler>;
export { deleteTransaction };

import { list as list_handler } from "../../../../transaction/list.js";
declare const list: WithCallOpts<typeof list_handler>;
export { list };

import { update as update_handler } from "../../../../transaction/update.js";
declare const update: WithCallOpts<typeof update_handler>;
export { update };


