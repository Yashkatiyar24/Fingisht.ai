declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T[];
    errors: any[];
    meta: any;
  }
  export function parse(input: string | File, config?: any): ParseResult<any>;
}

declare module 'xlsx' {
  export function read(data: any): any;
  export const utils: any;
}

// Augment backend client to allow transaction methods used from Encore
declare module 'encore.dev' {
  interface ServiceClient {
    transaction: {
      importTransactions?: (args: any) => Promise<any>;
      listTransactions?: (args: any) => Promise<any>;
    };
  }
}
