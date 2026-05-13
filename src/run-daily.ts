import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCES } from './config/sources.ts';
import { WATCHLIST } from './config/watchlist.ts';
import { getMarketDataSnapshots } from './lib/market-data/service.ts';
import { matchAssetsToHeadline } from './lib/match.ts';
import { buildMarkdownReport } from './lib/report.ts';
import { buildSiteAssets } from './lib/site.ts';
import { scoreAsset } from './lib/scoring.ts';
import { scrapeSources } from './lib/scrape.ts';
import type { AssetSignals, DailyReport, MarketDataSnapshot, RankedAsset, ScrapedSourceResult, WatchlistAsset } from './types/models.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const MIN_RANKED_IDEAS = 8;

function createEmptySignals(): AssetSignals {
  return {
    performanceSignals: [],
    sentimentSignals: [],
    macroSignals: [],
    sourceWeights: [],
    matchedHeadlines: [],
    marketData: null,
  };
}

function buildSignalsForAsset(
  asset: WatchlistAsset,
  sourceResults: ScrapedSourceResult[],
  marketData: Record<string, MarketDataSnapshot>,
): AssetSignals {
  const signals = createEmptySignals();
  signals.marketData = marketData[asset.symbol] ?? null;

  for (const source of sourceResults) {
    for (const item of source.headlines) {
      const matches = matchAssetsToHeadline(item.headline, [asset]);
      if (matches.length === 0) {
        continue;
      }

      if (item.performance) {
        signals.performanceSignals.push(item.performance);
      }

      signals.sentimentSignals.push(item.sentiment);
      signals.macroSignals.push(item.macro);
      signals.sourceWeights.push(source.credibilityWeight);
      signals.matchedHeadlines.push({
        source: source.sourceName,
        headline: item.headline,
      });
    }
  }

  return signals;
}

function buildRankings(
  sourceResults: ScrapedSourceResult[],
  marketData: Record<string, MarketDataSnapshot>,
): RankedAsset[] {
  const allRankings = WATCHLIST.map((asset) => {
    const signals = buildSignalsForAsset(asset, sourceResults, marketData);
    const score = scoreAsset(asset, signals);
    const rankingSource: RankedAsset['rankingSource'] = signals.matchedHeadlines.length > 0 ? 'signal' : 'backfill';

    return {
      ...score,
      supportingHeadlines: signals.matchedHeadlines.slice(0, 5),
      signalCount: signals.matchedHeadlines.length,
      rankingSource,
    };
  }).sort((left, right) => right.score - left.score);

  const signalBackedRankings = allRankings.filter((item) => item.signalCount > 0);
  const backfillRankings = allRankings.filter((item) => item.signalCount === 0);

  if (signalBackedRankings.length >= MIN_RANKED_IDEAS) {
    return signalBackedRankings.slice(0, MIN_RANKED_IDEAS);
  }

  return signalBackedRankings
    .concat(backfillRankings.slice(0, MIN_RANKED_IDEAS - signalBackedRankings.length))
    .slice(0, MIN_RANKED_IDEAS);
}

function buildReport(
  sourceResults: ScrapedSourceResult[],
  marketData: Record<string, MarketDataSnapshot>,
): DailyReport {
  return {
    generatedAt: new Date().toISOString(),
    rankings: buildRankings(sourceResults, marketData),
    sources: sourceResults.map((source) => ({
      id: source.sourceId,
      name: source.sourceName,
      url: source.url,
      headlineCount: source.headlineCount,
      error: source.error ?? null,
    })),
    headlineSample: sourceResults.flatMap((source) => source.headlines.map((item) => item.headline)).slice(0, 50),
  };
}

async function main(): Promise<void> {
  const outputDir = path.join(projectRoot, 'output');
  const siteDir = path.join(outputDir, 'site');
  await mkdir(outputDir, { recursive: true });
  await mkdir(siteDir, { recursive: true });

  const sourceResults = await scrapeSources(SOURCES);
  const marketData = await getMarketDataSnapshots(WATCHLIST.map((asset) => asset.symbol));
  const report = buildReport(sourceResults, marketData);
  const markdown = buildMarkdownReport(report);
  const siteAssets = buildSiteAssets(report);

  await writeFile(path.join(outputDir, 'latest-report.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(outputDir, 'latest-report.md'), `${markdown}\n`);
  await writeFile(path.join(siteDir, 'index.html'), siteAssets.html);
  await writeFile(path.join(siteDir, 'styles.css'), siteAssets.css);
  await writeFile(path.join(siteDir, 'app.js'), siteAssets.js);

  console.log(`Saved report with ${report.rankings.length} ranked assets to ${outputDir}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
