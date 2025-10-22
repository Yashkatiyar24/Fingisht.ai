import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { create as create_handler } from "../../../../budget/create.js";
declare const create: WithCallOpts<typeof create_handler>;
export { create };

import { list as list_handler } from "../../../../budget/list.js";
declare const list: WithCallOpts<typeof list_handler>;
export { list };


