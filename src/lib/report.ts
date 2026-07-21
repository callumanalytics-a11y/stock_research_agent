import type { DailyReport } from '../types/models.ts';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPercentPoints(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatPrice(value: number): string {
  return value.toFixed(2);
}

function formatEventType(value: string): string {
  return value.replaceAll('_', ' ');
}

function formatEventMix(topEvents: { eventType: string; direction: string; count: number }[]): string {
  if (topEvents.length === 0) {
    return 'none';
  }

  return topEvents
    .map((event) => `${formatEventType(event.eventType)} ${event.direction} x${event.count}`)
    .join(', ');
}

export function buildMarkdownReport(report: DailyReport): string {
  const lines: string[] = [
    '# Daily Finance Research Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Top Ideas',
    '',
  ];

  for (const item of report.rankings.slice(0, 10)) {
    const { eventConfidence, breakdown } = item;
    const eventPrefix = breakdown.eventScore > 0 ? '+' : '';
    const sourceLabel = item.rankingSource === 'signal' ? 'signal-backed idea' : 'backfill watchlist idea';
    lines.push(`- ${item.symbol} (${item.label}): ${item.score}/100 - ${item.conviction} [${sourceLabel}]`);
    lines.push(
      `  Event call: ${eventConfidence.label} at ${formatPercent(eventConfidence.confidence)} confidence from ${eventConfidence.sampleSize} events`,
    );
    lines.push(
      `  Event probs: bullish ${formatPercent(eventConfidence.probabilities.bullish)}, neutral ${formatPercent(eventConfidence.probabilities.neutral)}, bearish ${formatPercent(eventConfidence.probabilities.bearish)}`,
    );
    lines.push(`  Event mix: ${formatEventMix(eventConfidence.topEvents)}`);
    lines.push(
      `  Market score: ${breakdown.momentum > 0 ? '+' : ''}${breakdown.momentum.toFixed(2)} from trend ${formatPercentPoints(breakdown.rawMomentumPercent)} and vol scale ${breakdown.volatilityScale.toFixed(2)}x`,
    );
    lines.push(
      `  Event overlay: ${eventPrefix}${breakdown.eventScore} (macro ${breakdown.macro > 0 ? '+' : ''}${breakdown.macro}, credibility ${breakdown.credibility > 0 ? '+' : ''}${breakdown.credibility}, risk ${breakdown.riskPenalty})`,
    );
    if (item.marketData?.quote) {
      const quote = item.marketData.quote;
      const dailyMove = quote.changePercent === undefined ? 'n/a' : formatPercent(quote.changePercent / 100);
      const fiveDayMove = item.marketData.momentum ? formatPercent(item.marketData.momentum.fiveDayPercent / 100) : 'n/a';
      lines.push(
        `  Market data: ${quote.provider} last ${formatPrice(quote.lastPrice)} | 1D ${dailyMove} | 5D ${fiveDayMove} | momentum source ${breakdown.momentumSource}`,
      );
    } else {
      lines.push(`  Market data: unavailable | momentum source ${breakdown.momentumSource}`);
    }
    if (item.realizedVolatility) {
      lines.push(
        `  Realized vol: 5D ${formatPercentPoints(item.realizedVolatility.fiveDay)} | 20D ${formatPercentPoints(item.realizedVolatility.twentyDay)} | ann. 20D ${formatPercentPoints(item.realizedVolatility.annualizedTwentyDay)}`,
      );
    }
    if (item.benchmarkComparison) {
      lines.push(
        `  Benchmark: ${item.benchmarkComparison.benchmarkSymbol} | rel. 5D ${formatPercentPoints(item.benchmarkComparison.relativeReturn5d)} | rel. 20D ${formatPercentPoints(item.benchmarkComparison.relativeReturn20d)}`,
      );
    }
  }

  lines.push('');
  lines.push('## Source Coverage');
  lines.push('');

  for (const source of report.sources) {
    lines.push(`- ${source.name}: ${source.headlineCount} extracted headlines`);
  }

  lines.push('');
  lines.push('## Headline Sample');
  lines.push('');

  for (const headline of report.headlineSample.slice(0, 12)) {
    lines.push(`- ${headline}`);
  }

  return lines.join('\n');
}
