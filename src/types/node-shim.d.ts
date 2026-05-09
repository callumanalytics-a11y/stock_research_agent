declare module 'node:fs/promises' {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, data: string): Promise<void>;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;

  const path: {
    dirname: typeof dirname;
    join: typeof join;
    resolve: typeof resolve;
  };

  export default path;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

declare module 'node:assert/strict' {
  export function equal<T>(actual: T, expected: T): void;
  export function ok(value: unknown): void;

  const assert: {
    equal: typeof equal;
    ok: typeof ok;
  };

  export default assert;
}

declare module 'node:test' {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}

declare const process: {
  exitCode?: number;
};
