declare module 'playwright' {
  export interface Page {
    goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<void>;
    waitForTimeout(timeout: number): Promise<void>;
    evaluate<Result, Arg>(pageFunction: (arg: Arg) => Result, arg: Arg): Promise<Result>;
    close(): Promise<void>;
  }

  export interface BrowserContext {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Browser {
    newContext(options?: { userAgent?: string }): Promise<BrowserContext>;
    close(): Promise<void>;
  }

  export const chromium: {
    launch(options?: { headless?: boolean }): Promise<Browser>;
  };
}
