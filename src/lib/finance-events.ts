import type {
  FinanceEventDirection,
  FinanceEventMix,
  FinanceEventProbabilities,
  FinanceEventSignal,
  FinanceEventSummary,
  FinanceEventType,
} from '../types/models.ts';
import { normalizeText } from './text.ts';

interface FinanceEventRule {
  eventType: FinanceEventType;
  direction: FinanceEventDirection;
  strength: number;
  confidence: number;
  patterns: RegExp[];
}

function softmax(values: number[]): number[] {
  const maxValue = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - maxValue));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

function probabilitiesFromLogits(logits: {
  bullish: number;
  neutral: number;
  bearish: number;
}): FinanceEventProbabilities {
  const [bullish, neutral, bearish] = softmax([logits.bullish, logits.neutral, logits.bearish]);

  return {
    bullish,
    neutral,
    bearish,
  };
}

function labelFromProbabilities(probabilities: FinanceEventProbabilities): FinanceEventDirection {
  if (probabilities.bullish >= probabilities.neutral && probabilities.bullish >= probabilities.bearish) {
    return 'bullish';
  }

  if (probabilities.bearish >= probabilities.neutral) {
    return 'bearish';
  }

  return 'neutral';
}

function firstMatch(patterns: RegExp[], text: string): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match) {
      return match[0];
    }
  }

  return null;
}

const FINANCE_EVENT_RULES: FinanceEventRule[] = [
  {
    eventType: 'earnings',
    direction: 'bullish',
    strength: 1.2,
    confidence: 0.9,
    patterns: [
      /beats?\s+estimates?/i,
      /beat(?:s)?\s+expectations?/i,
      /tops?\s+forecasts?/i,
      /earnings\s+beat/i,
      /revenue\s+beats?/i,
      /profit\s+rises?/i,
      /better-than-expected\s+(?:results|earnings|profit|revenue)/i,
    ],
  },
  {
    eventType: 'earnings',
    direction: 'bearish',
    strength: 1.2,
    confidence: 0.9,
    patterns: [
      /miss(?:es|ed)?\s+estimates?/i,
      /miss(?:es|ed)?\s+expectations?/i,
      /miss(?:es|ed)?\s+forecasts?/i,
      /earnings\s+miss/i,
      /revenue\s+miss(?:es|ed)?/i,
      /profit\s+falls?/i,
      /widen(?:s|ed)?\s+loss(?:es)?/i,
      /profit\s+warning/i,
    ],
  },
  {
    eventType: 'guidance',
    direction: 'bullish',
    strength: 1.4,
    confidence: 0.95,
    patterns: [
      /raises?\s+guidance/i,
      /lifts?\s+guidance/i,
      /guidance\s+raised/i,
      /raises?\s+forecast/i,
      /upgrades?\s+outlook/i,
      /better outlook/i,
      /stronger outlook/i,
    ],
  },
  {
    eventType: 'guidance',
    direction: 'bearish',
    strength: 1.4,
    confidence: 0.95,
    patterns: [
      /cuts?\s+guidance/i,
      /lowers?\s+guidance/i,
      /guidance\s+cut/i,
      /slashes?\s+forecast/i,
      /weaker outlook/i,
      /warns?\s+on\s+guidance/i,
    ],
  },
  {
    eventType: 'analyst_rating',
    direction: 'bullish',
    strength: 0.8,
    confidence: 0.8,
    patterns: [
      /upgraded?\s+to\s+buy/i,
      /raises?\s+rating/i,
      /initiates?\s+at\s+buy/i,
      /reiterates?\s+buy/i,
      /upgrade(?:d)?\b/i,
    ],
  },
  {
    eventType: 'analyst_rating',
    direction: 'bearish',
    strength: 0.8,
    confidence: 0.8,
    patterns: [
      /downgraded?\s+to\s+sell/i,
      /cuts?\s+rating/i,
      /initiates?\s+at\s+sell/i,
      /reiterates?\s+underweight/i,
      /downgrade(?:d)?\b/i,
    ],
  },
  {
    eventType: 'regulation',
    direction: 'bullish',
    strength: 0.9,
    confidence: 0.75,
    patterns: [
      /wins?\s+approval/i,
      /regulatory\s+nod/i,
      /clearance/i,
      /approval/i,
    ],
  },
  {
    eventType: 'regulation',
    direction: 'bearish',
    strength: 1.0,
    confidence: 0.85,
    patterns: [
      /probe/i,
      /investigation/i,
      /fine/i,
      /antitrust/i,
      /scrutiny/i,
      /ban/i,
      /regulator/i,
    ],
  },
  {
    eventType: 'litigation',
    direction: 'bullish',
    strength: 0.8,
    confidence: 0.75,
    patterns: [
      /lawsuit\s+dismissed/i,
      /wins?\s+lawsuit/i,
      /settles?/i,
      /settlement/i,
      /court\s+victory/i,
    ],
  },
  {
    eventType: 'litigation',
    direction: 'bearish',
    strength: 1.0,
    confidence: 0.85,
    patterns: [
      /(?<!dismissed\s)lawsuit/i,
      /sued/i,
      /litigation/i,
      /court\s+battle/i,
      /trial/i,
      /appeal/i,
    ],
  },
  {
    eventType: 'capital_return',
    direction: 'bullish',
    strength: 0.7,
    confidence: 0.7,
    patterns: [
      /buyback/i,
      /share\s+repurchase/i,
      /dividend\s+hike/i,
      /special\s+dividend/i,
    ],
  },
  {
    eventType: 'capital_return',
    direction: 'bearish',
    strength: 0.7,
    confidence: 0.7,
    patterns: [
      /dividend\s+cut/i,
      /cuts?\s+dividend/i,
      /suspends?\s+dividend/i,
    ],
  },
  {
    eventType: 'm_and_a',
    direction: 'bullish',
    strength: 1.1,
    confidence: 0.8,
    patterns: [
      /acquir(?:es|ed|ing)/i,
      /acquisition/i,
      /takeover/i,
      /merger/i,
      /buyout/i,
    ],
  },
  {
    eventType: 'm_and_a',
    direction: 'bearish',
    strength: 1.1,
    confidence: 0.8,
    patterns: [
      /deal\s+collapses?/i,
      /bid\s+rejected/i,
      /blocked\s+acquisition/i,
      /merger\s+blocked/i,
    ],
  },
  {
    eventType: 'product',
    direction: 'bullish',
    strength: 0.6,
    confidence: 0.65,
    patterns: [
      /launch(?:es|ed|ing)?/i,
      /wins?\s+contract/i,
      /expands?/i,
      /rollout/i,
      /new\s+product/i,
    ],
  },
  {
    eventType: 'product',
    direction: 'bearish',
    strength: 0.8,
    confidence: 0.75,
    patterns: [
      /recall/i,
      /delay/i,
      /cancels?/i,
      /production\s+halt/i,
    ],
  },
];

export function extractFinanceEvents(text: string): FinanceEventSignal[] {
  const normalized = normalizeText(text);
  const events: FinanceEventSignal[] = [];

  for (const rule of FINANCE_EVENT_RULES) {
    const phrase = firstMatch(rule.patterns, normalized);

    if (!phrase) {
      continue;
    }

    events.push({
      eventType: rule.eventType,
      direction: rule.direction,
      confidence: rule.confidence,
      strength: rule.strength,
      phrase,
    });
  }

  return events;
}

function eventDirectionSign(direction: FinanceEventDirection): number {
  if (direction === 'bullish') {
    return 1;
  }

  if (direction === 'bearish') {
    return -1;
  }

  return 0;
}

function confidenceWeight(confidence: number): number {
  return Math.max(0, Math.min(1, confidence));
}

export function summarizeFinanceEvents(signals: FinanceEventSignal[]): FinanceEventSummary {
  if (signals.length === 0) {
    return {
      label: 'neutral',
      confidence: 1 / 3,
      probabilities: {
        bullish: 1 / 3,
        neutral: 1 / 3,
        bearish: 1 / 3,
      },
      sampleSize: 0,
      topEventType: 'none',
      topEvents: [],
    };
  }

  const typeScores = new Map<FinanceEventType, number>();
  const typeDirections = new Map<FinanceEventType, { bullish: number; bearish: number; neutral: number }>();
  const typeCounts = new Map<FinanceEventType, number>();
  let bullishLogit = 0;
  let bearishLogit = 0;
  let neutralLogit = 0.15;

  for (const signal of signals) {
    const weight = signal.strength * confidenceWeight(signal.confidence) * confidenceWeight(signal.sourceWeight ?? 1);
    const signedWeight = weight * eventDirectionSign(signal.direction);

    bullishLogit += Math.max(signedWeight, 0);
    bearishLogit += Math.max(-signedWeight, 0);
    neutralLogit += signal.direction === 'neutral' ? weight : weight * 0.03;

    const prior = typeScores.get(signal.eventType) ?? 0;
    typeScores.set(signal.eventType, prior + signedWeight);

    const typeDirection = typeDirections.get(signal.eventType) ?? { bullish: 0, bearish: 0, neutral: 0 };
    typeDirection[signal.direction] += weight;
    typeDirections.set(signal.eventType, typeDirection);

    typeCounts.set(signal.eventType, (typeCounts.get(signal.eventType) ?? 0) + 1);
  }

  const probabilities = probabilitiesFromLogits({
    bullish: bullishLogit,
    neutral: neutralLogit,
    bearish: bearishLogit,
  });
  const label = labelFromProbabilities(probabilities);

  const rankedEvents = Array.from(typeDirections.entries())
    .map(([eventType, counts]) => {
      const bullish = counts.bullish;
      const bearish = counts.bearish;
      const neutral = counts.neutral;
      const direction: FinanceEventDirection =
        bullish === bearish
          ? 'neutral'
          : bullish > bearish
            ? 'bullish'
            : 'bearish';

      return {
        eventType,
        count: typeCounts.get(eventType) ?? 0,
        direction,
        score: Math.abs(typeScores.get(eventType) ?? 0),
      };
    })
    .sort((left, right) => right.score - left.score);

  const topEvents: FinanceEventMix[] = rankedEvents
    .slice(0, 3)
    .map(({ score: _score, ...entry }) => entry);

  const topEventType = topEvents[0]?.eventType ?? 'none';

  return {
    label,
    confidence: probabilities[label],
    probabilities,
    sampleSize: signals.length,
    topEventType,
    topEvents,
  };
}
