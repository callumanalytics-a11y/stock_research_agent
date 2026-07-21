import { readFile } from 'node:fs/promises';
import path from 'node:path';

function parseEnvFile(contents: string): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env?.[key] === undefined) {
      entries[key] = value;
    }
  }

  return entries;
}

export async function loadEnvFile(projectRoot: string, fileName = '.env'): Promise<void> {
  const envPath = path.join(projectRoot, fileName);

  try {
    const contents = await readFile(envPath, 'utf8');
    const parsed = parseEnvFile(contents);

    for (const [key, value] of Object.entries(parsed)) {
      if (process.env) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
  }
}
