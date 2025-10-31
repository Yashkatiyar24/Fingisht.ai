declare module 'encore.dev' {
  interface ServiceClient {
    transaction?: any;
  }
}

declare module 'encore.dev/service' {
  export class Service {
    constructor(name: string);
  }
}
