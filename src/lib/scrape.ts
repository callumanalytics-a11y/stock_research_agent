import { chromium } from 'playwright';
import type { PublicationSource, ScrapedHeadline, ScrapedSourceResult } from '../types/models.ts';
import { extractHeadlineCandidates, financeEventsFromHeadline, macroThemeScore, parsePerformanceSignal } from './extract.ts';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function scrapeSources(sources: PublicationSource[]): Promise<ScrapedSourceResult[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: DEFAULT_USER_AGENT,
  });

  try {
    const results: ScrapedSourceResult[] = [];

    for (const source of sources) {
      const page = await context.newPage();

      try {
        await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        const rawTexts = await page.evaluate((selectors: string[]) => {
          const values: string[] = [];

          for (const selector of selectors) {
            const nodes = Array.from(document.querySelectorAll(selector));
            for (const node of nodes) {
              const text = node.textContent?.trim();
              if (text) {
                values.push(text);
              }
            }
          }

          return values;
        }, source.selectors);

        const headlines: ScrapedHeadline[] = extractHeadlineCandidates(rawTexts).map((headline) => ({
          headline,
          performance: parsePerformanceSignal(headline),
          events: financeEventsFromHeadline(headline),
          macro: macroThemeScore(headline),
        }));

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          url: source.url,
          credibilityWeight: source.credibilityWeight,
          headlines,
          headlineCount: headlines.length,
        });
      } catch (error) {
        results.push({
          sourceId: source.id,
          sourceName: source.name,
          url: source.url,
          credibilityWeight: source.credibilityWeight,
          headlines: [],
          headlineCount: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        await page.close();
      }
    }

    return results;
  } finally {
    await context.close();
    await browser.close();
  }
}
