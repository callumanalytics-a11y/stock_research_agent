import type { FinanceEventSignal, PerformanceSignal } from '../types/models.ts';
import { extractFinanceEvents } from './finance-events.ts';
import { normalizeText, normalizeWhitespace, uniqueBy } from './text.ts';

const PERFORMANCE_PATTERNS = [
  /(?<direction>up|down|higher|lower|rises?|falls?|gains?|drops?|jumps?|slides?|surges?|slumps?)\s+(?<percent>\d+(?:\.\d+)?)%/i,
  /(?<percent>\d+(?:\.\d+)?)%\s+(?<direction>higher|lower|up|down)/i,
];

const NEGATIVE_DIRECTIONS = ['down', 'lower', 'fall', 'falls', 'drop', 'drops', 'slide', 'slides', 'slump', 'slumps'];

export function extractHeadlineCandidates(rawTexts: string[]): string[] {
  return uniqueBy(
    rawTexts
      .map((value) => normalizeWhitespace(value))
      .filter((value) => value.length >= 30)
      .filter((value) => /[a-z]/i.test(value)),
    (value) => normalizeText(value),
  );
}

export function parsePerformanceSignal(text: string): PerformanceSignal | null {
  for (const pattern of PERFORMANCE_PATTERNS) {
    const match = text.match(pattern);
    const groups = match?.groups as { direction?: string; percent?: string } | undefined;

    if (!match || !groups?.direction || !groups.percent) {
      continue;
    }

    const percent = Number(groups.percent);
    const rawDirection = groups.direction.toLowerCase();
    const isNegative = NEGATIVE_DIRECTIONS.some((term) => rawDirection.startsWith(term));

    const phrase = match[0];

    return {
      percentChange: isNegative ? percent * -1 : percent,
      phrase,
    };
  }

  return null;
}

export function financeEventsFromHeadline(text: string): FinanceEventSignal[] {
  return extractFinanceEvents(text);
}

export function macroThemeScore(text: string): number {
  const normalized = normalizeText(text);
  let score = 0;

  if (normalized.includes('ai') || normalized.includes('artificial intelligence')) {
    score += 2;
  }

  if (normalized.includes('rate cut') || normalized.includes('easing')) {
    score += 2;
  }

  if (normalized.includes('inflation cools') || normalized.includes('soft landing')) {
    score += 1;
  }

  if (normalized.includes('recession') || normalized.includes('tariff')) {
    score -= 2;
  }

  return score;
}
