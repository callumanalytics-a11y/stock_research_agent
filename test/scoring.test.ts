import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyMarketSnapshot } from '../src/lib/market-data/provider.ts';
import { scoreAsset } from '../src/lib/scoring.ts';
import type { AssetSignals, FinanceEventSignal, WatchlistAsset } from '../src/types/models.ts';

function makeEvent(overrides: Partial<FinanceEventSignal>): FinanceEventSignal {
  return {
    eventType: 'other',
    direction: 'neutral',
    confidence: 0.5,
    strength: 0.5,
    phrase: 'headline event',
    ...overrides,
  };
}

function buildSignals(overrides: Partial<AssetSignals>): AssetSignals {
  return {
    performanceSignals: [],
    eventSignals: [],
    macroSignals: [],
    sourceWeights: [],
    matchedHeadlines: [],
    marketData: null,
    realizedVolatility: null,
    benchmarkComparison: null,
    ...overrides,
  };
}

test('scoreAsset rewards strong positive signals', () => {
  const asset: WatchlistAsset = { symbol: 'NVDA', label: 'Nvidia', type: 'stock', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      performanceSignals: [{ percentChange: 4.2, phrase: 'up 4.2%' }],
      eventSignals: [
        makeEvent({
          eventType: 'earnings',
          direction: 'bullish',
          confidence: 0.92,
          strength: 1.2,
          phrase: 'beats estimates',
          sourceWeight: 1,
        }),
        makeEvent({
          eventType: 'guidance',
          direction: 'bullish',
          confidence: 0.95,
          strength: 1.4,
          phrase: 'raises guidance',
          sourceWeight: 0.98,
        }),
      ],
      macroSignals: [2],
      sourceWeights: [1, 0.98],
    }),
  );

  assert.equal(result.symbol, 'NVDA');
  assert.ok(result.score > 70);
  assert.equal(result.eventConfidence.label, 'bullish');
  assert.ok(result.eventConfidence.confidence > 0.5);
  assert.ok(result.breakdown.eventScore > 0);
  assert.ok(result.breakdown.eventConfidenceWeight > 0.5);
  assert.equal(result.breakdown.momentumSource, 'headline_fallback');
});

test('scoreAsset penalizes negative signals', () => {
  const asset: WatchlistAsset = { symbol: 'TSLA', label: 'Tesla', type: 'stock', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      performanceSignals: [{ percentChange: -5.5, phrase: 'down 5.5%' }],
      eventSignals: [
        makeEvent({
          eventType: 'regulation',
          direction: 'bearish',
          confidence: 0.9,
          strength: 1,
          phrase: 'probe',
          sourceWeight: 0.82,
        }),
        makeEvent({
          eventType: 'litigation',
          direction: 'bearish',
          confidence: 0.9,
          strength: 1,
          phrase: 'lawsuit',
          sourceWeight: 0.85,
        }),
      ],
      macroSignals: [-2],
      sourceWeights: [0.82, 0.85],
    }),
  );

  assert.ok(result.score < 50);
  assert.equal(result.eventConfidence.label, 'bearish');
  assert.ok(result.eventConfidence.confidence > 0.5);
  assert.ok(result.breakdown.eventScore < 0);
  assert.ok(result.breakdown.eventConfidenceWeight > 0.5);
  assert.equal(result.breakdown.momentumSource, 'headline_fallback');
});

test('scoreAsset dampens low-confidence mixed event signals', () => {
  const asset: WatchlistAsset = { symbol: 'SPY', label: 'SPDR S&P 500 ETF', type: 'index_fund', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      eventSignals: [
        makeEvent({
          eventType: 'analyst_rating',
          direction: 'bullish',
          confidence: 0.8,
          strength: 0.8,
          phrase: 'upgrade',
          sourceWeight: 1,
        }),
        makeEvent({
          eventType: 'analyst_rating',
          direction: 'bearish',
          confidence: 0.8,
          strength: 0.8,
          phrase: 'downgrade',
          sourceWeight: 1,
        }),
      ],
      sourceWeights: [1],
    }),
  );

  assert.ok(result.eventConfidence.confidence < 0.5);
  assert.ok(result.breakdown.eventConfidenceWeight < 0.3);
  assert.equal(result.breakdown.eventScore, 0);
  assert.equal(result.breakdown.momentumSource, 'none');
});

test('scoreAsset prefers market-data momentum when available', () => {
  const asset: WatchlistAsset = { symbol: 'AAPL', label: 'Apple', type: 'stock', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      performanceSignals: [{ percentChange: -5, phrase: 'down 5%' }],
      marketData: {
        ...createEmptyMarketSnapshot('AAPL', 'alpaca'),
        momentum: {
          dailyPercent: 4,
          fiveDayPercent: 6,
        },
      },
      realizedVolatility: {
        fiveDay: 1.2,
        twentyDay: 2.1,
        annualizedTwentyDay: 33.36,
      },
      benchmarkComparison: {
        benchmarkSymbol: 'QQQ',
        assetFiveDayReturn: 6,
        assetTwentyDayReturn: 8,
        benchmarkFiveDayReturn: 3,
        benchmarkTwentyDayReturn: 4,
        relativeReturn5d: 3,
        relativeReturn20d: 4,
      },
    }),
  );

  assert.equal(result.breakdown.momentumSource, 'market_data');
  assert.equal(Number(result.breakdown.rawMomentumPercent.toFixed(2)), 8.9);
  assert.ok(result.breakdown.momentum > 0);
});

test('scoreAsset lowers the market score when volatility is higher', () => {
  const asset: WatchlistAsset = { symbol: 'AAPL', label: 'Apple', type: 'stock', aliases: [] };
  const baseSignals = {
    marketData: {
      ...createEmptyMarketSnapshot('AAPL', 'alpaca'),
      momentum: {
        dailyPercent: 2,
        fiveDayPercent: 4,
      },
    },
    benchmarkComparison: {
      benchmarkSymbol: 'QQQ',
      assetFiveDayReturn: 4,
      assetTwentyDayReturn: 6,
      benchmarkFiveDayReturn: 1,
      benchmarkTwentyDayReturn: 2,
      relativeReturn5d: 3,
      relativeReturn20d: 4,
    },
  };

  const lowVol = scoreAsset(
    asset,
    buildSignals({
      ...baseSignals,
      realizedVolatility: {
        fiveDay: 0.8,
        twentyDay: 1.2,
        annualizedTwentyDay: 19.08,
      },
    }),
  );

  const highVol = scoreAsset(
    asset,
    buildSignals({
      ...baseSignals,
      realizedVolatility: {
        fiveDay: 3.2,
        twentyDay: 6.5,
        annualizedTwentyDay: 103.18,
      },
    }),
  );

  assert.ok(lowVol.score > highVol.score);
  assert.ok(lowVol.breakdown.momentum > highVol.breakdown.momentum);
});
