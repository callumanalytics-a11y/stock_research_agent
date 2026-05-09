import type { AssetSignals, ConvictionLabel, ScoredAsset, WatchlistAsset } from '../types/models.ts';
import { summarizeSentimentConfidence } from './sentiment.ts';
import { clamp } from './text.ts';

function normalizeMomentum(percentChange = 0): number {
  return clamp(percentChange, -10, 10) * 3;
}

function normalizeSentiment(netSentiment = 0): number {
  return clamp(netSentiment * 6, -18, 18);
}

function sentimentDirectionFromProbabilities(
  probabilities: { positive: number; neutral: number; negative: number },
): number {
  return probabilities.positive - probabilities.negative;
}

function confidenceWeight(confidence: number): number {
  return clamp((confidence - 1 / 3) / (2 / 3), 0, 1);
}

function normalizeMacro(score = 0): number {
  return clamp(score * 4, -12, 12);
}

function normalizeCredibility(weight = 0): number {
  return clamp(Math.round(weight * 15), 0, 15);
}

function labelForScore(score: number): ConvictionLabel {
  if (score >= 75) {
    return 'high-priority research';
  }

  if (score >= 60) {
    return 'positive watchlist';
  }

  if (score >= 45) {
    return 'mixed / monitor';
  }

  return 'low conviction';
}

export function scoreAsset(asset: WatchlistAsset, signals: AssetSignals): ScoredAsset {
  const sentimentConfidence = summarizeSentimentConfidence(signals.sentimentSignals);
  const netSentiment = signals.sentimentSignals.reduce((sum, item) => sum + item.netSentiment, 0);
  const rawSentiment = normalizeSentiment(netSentiment);
  const sentimentDirection = sentimentDirectionFromProbabilities(sentimentConfidence.probabilities);
  const sentimentConfidenceWeight = confidenceWeight(sentimentConfidence.confidence);
  const momentum = normalizeMomentum(
    signals.performanceSignals.reduce((sum, item) => sum + item.percentChange, 0),
  );
  const sentiment = Math.round(Math.abs(rawSentiment) * sentimentDirection * sentimentConfidenceWeight);
  const macro = normalizeMacro(signals.macroSignals.reduce((sum, value) => sum + value, 0));
  const credibility = normalizeCredibility(
    signals.sourceWeights.reduce((sum, value) => sum + value, 0) / Math.max(signals.sourceWeights.length, 1),
  );
  const riskPenalty = Math.min(
    25,
    signals.sentimentSignals.filter((item) => item.netSentiment < 0).length * 5,
  );

  const rawScore = 50 + momentum + sentiment + macro + credibility - riskPenalty;
  const score = clamp(Math.round(rawScore), 0, 100);

  return {
    symbol: asset.symbol,
    label: asset.label,
    type: asset.type,
    score,
    conviction: labelForScore(score),
    sentimentConfidence,
    breakdown: {
      base: 50,
      momentum,
      sentiment,
      sentimentConfidenceWeight,
      macro,
      credibility,
      riskPenalty: riskPenalty * -1,
    },
  };
}
