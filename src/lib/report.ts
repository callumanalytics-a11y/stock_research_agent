import type { DailyReport } from '../types/models.ts';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
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
    const { sentimentConfidence, breakdown } = item;
    const impactPrefix = breakdown.sentiment > 0 ? '+' : '';
    const sourceLabel = item.rankingSource === 'signal' ? 'signal-backed idea' : 'backfill watchlist idea';
    lines.push(`- ${item.symbol} (${item.label}): ${item.score}/100 - ${item.conviction} [${sourceLabel}]`);
    lines.push(
      `  Sentiment: ${sentimentConfidence.label} at ${formatPercent(sentimentConfidence.confidence)} confidence from ${sentimentConfidence.sampleSize} headlines`,
    );
    lines.push(
      `  Predict probs: pos ${formatPercent(sentimentConfidence.probabilities.positive)}, neutral ${formatPercent(sentimentConfidence.probabilities.neutral)}, neg ${formatPercent(sentimentConfidence.probabilities.negative)}`,
    );
    lines.push(
      `  Weighted score impact: ${impactPrefix}${breakdown.sentiment} with confidence weight ${sentimentConfidence.confidence.toFixed(3)} and damping ${breakdown.sentimentConfidenceWeight.toFixed(3)}`,
    );
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
