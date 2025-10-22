import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { create as create_handler } from "../../../../category/create.js";
declare const create: WithCallOpts<typeof create_handler>;
export { create };

import { list as list_handler } from "../../../../category/list.js";
declare const list: WithCallOpts<typeof list_handler>;
export { list };

import { listRules as listRules_handler } from "../../../../category/rules.js";
declare const listRules: WithCallOpts<typeof listRules_handler>;
export { listRules };

import { createRule as createRule_handler } from "../../../../category/rules.js";
declare const createRule: WithCallOpts<typeof createRule_handler>;
export { createRule };


