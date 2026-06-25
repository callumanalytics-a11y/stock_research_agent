import type { AssetSignals, ConvictionLabel, ScoredAsset, WatchlistAsset } from '../types/models.ts';
import { summarizeFinanceEvents } from './finance-events.ts';
import { clamp } from './text.ts';

function normalizeMomentum(percentChange = 0): number {
  return clamp(percentChange, -10, 10) * 3;
}

function marketMomentumBlend(
  signals: AssetSignals,
): {
  value: number;
  source: 'market_data' | 'headline_fallback' | 'none';
  rawTrendPercent: number;
  volatilityScale: number;
} {
  const marketMomentum = signals.marketData?.momentum;
  const benchmarkAdjustment = signals.benchmarkComparison
    ? signals.benchmarkComparison.relativeReturn20d * 0.6 + signals.benchmarkComparison.relativeReturn5d * 0.4
    : 0;
  const volatilityScale = signals.realizedVolatility
    ? 1 + signals.realizedVolatility.annualizedTwentyDay / 20
    : 1;

  if (marketMomentum) {
    const rawTrendPercent =
      marketMomentum.dailyPercent * 0.35 +
      marketMomentum.fiveDayPercent * 0.65 +
      benchmarkAdjustment;

    return {
      value: clamp((rawTrendPercent / volatilityScale) * 10, -22, 22),
      source: 'market_data',
      rawTrendPercent,
      volatilityScale,
    };
  }

  if (signals.performanceSignals.length > 0) {
    const rawTrendPercent = signals.performanceSignals.reduce((sum, item) => sum + item.percentChange, 0) + benchmarkAdjustment;

    return {
      value: normalizeMomentum(rawTrendPercent),
      source: 'headline_fallback',
      rawTrendPercent,
      volatilityScale: 1,
    };
  }

  return {
    value: 0,
    source: 'none',
    rawTrendPercent: 0,
    volatilityScale: 1,
  };
}

function confidenceWeight(confidence: number): number {
  return clamp((confidence - 0.25) / 0.75, 0, 1);
}

function normalizeEventOverlay(eventScore: number, macro: number, credibility: number, riskPenalty: number): number {
  const credibilityScale = eventScore === 0 ? 1 : 1 + Math.min(credibility, 10) / 50;
  const overlay = clamp(Math.round(eventScore * credibilityScale + macro * 0.2 - riskPenalty * 0.25), -10, 10);

  return Object.is(overlay, -0) ? 0 : overlay;
}

function normalizeMacro(score = 0): number {
  return clamp(score * 3, -9, 9);
}

function normalizeCredibility(weight = 0): number {
  return clamp(Math.round(weight * 10), 0, 10);
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
  const eventConfidence = summarizeFinanceEvents(signals.eventSignals);
  const momentumInput = marketMomentumBlend(signals);
  const eventDirection =
    eventConfidence.probabilities.bullish - eventConfidence.probabilities.bearish;
  const eventConfidenceWeight = confidenceWeight(eventConfidence.confidence);
  const eventNetScore = signals.eventSignals.reduce((sum, item) => {
    const direction = item.direction === 'bullish' ? 1 : item.direction === 'bearish' ? -1 : 0;
    const sourceWeight = item.sourceWeight ?? 1;
    return sum + direction * item.strength * item.confidence * sourceWeight;
  }, 0);
  const eventScore = Math.round(
    clamp((eventNetScore * 9 + eventDirection * 4) * eventConfidenceWeight, -12, 12),
  );
  const macro = normalizeMacro(signals.macroSignals.reduce((sum, value) => sum + value, 0));
  const credibility = normalizeCredibility(
    signals.sourceWeights.reduce((sum, value) => sum + value, 0) / Math.max(signals.sourceWeights.length, 1),
  );
  const riskPenalty = Math.min(6, signals.eventSignals.filter((item) => item.direction === 'bearish').length * 2);
  const marketScore = momentumInput.value;
  const eventOverlay = normalizeEventOverlay(eventScore, macro, credibility, riskPenalty);
  const benchmarkRelative = signals.benchmarkComparison
    ? signals.benchmarkComparison.relativeReturn20d * 0.5 + signals.benchmarkComparison.relativeReturn5d * 0.5
    : 0;
  const volatilityPenalty = 0;

  const rawScore = 50 + marketScore + eventOverlay - volatilityPenalty;
  const score = clamp(Math.round(rawScore), 0, 100);

  return {
    symbol: asset.symbol,
    label: asset.label,
    type: asset.type,
    score,
    conviction: labelForScore(score),
    marketData: signals.marketData,
    realizedVolatility: signals.realizedVolatility,
    benchmarkComparison: signals.benchmarkComparison,
    eventConfidence,
    breakdown: {
      base: 50,
      momentum: marketScore,
      rawMomentumPercent: momentumInput.rawTrendPercent,
      momentumSource: momentumInput.source,
      volatilityScale: momentumInput.volatilityScale,
      benchmarkRelative,
      volatilityPenalty: -volatilityPenalty,
      eventScore: eventOverlay,
      eventConfidenceWeight,
      macro,
      credibility,
      riskPenalty: riskPenalty * -1,
    },
  };
}
