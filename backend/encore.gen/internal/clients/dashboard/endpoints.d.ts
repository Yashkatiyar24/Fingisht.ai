import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { getStats as getStats_handler } from "../../../../dashboard/stats.js";
declare const getStats: WithCallOpts<typeof getStats_handler>;
export { getStats };


