import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSiteAssets } from './lib/site.ts';
import type { DailyReport } from './types/models.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function writeSite(report: DailyReport): Promise<void> {
  const siteDir = path.join(projectRoot, 'output', 'site');
  const assets = buildSiteAssets(report);

  await mkdir(siteDir, { recursive: true });
  await writeFile(path.join(siteDir, 'index.html'), assets.html);
  await writeFile(path.join(siteDir, 'styles.css'), assets.css);
  await writeFile(path.join(siteDir, 'app.js'), assets.js);
}

async function main(): Promise<void> {
  const reportPath = path.join(projectRoot, 'output', 'latest-report.json');
  const report = JSON.parse(await readFile(reportPath, 'utf8')) as DailyReport;
  await writeSite(report);
  console.log('Built report site in output/site');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
