import assert from 'node:assert/strict';
import test from 'node:test';
import { predictSentimentFromHits } from '../src/lib/sentiment.ts';
import { scoreAsset } from '../src/lib/scoring.ts';
import type { AssetSignals, WatchlistAsset } from '../src/types/models.ts';

function buildSignals(overrides: Partial<AssetSignals>): AssetSignals {
  return {
    performanceSignals: [],
    sentimentSignals: [],
    macroSignals: [],
    sourceWeights: [],
    matchedHeadlines: [],
    ...overrides,
  };
}

test('scoreAsset rewards strong positive signals', () => {
  const asset: WatchlistAsset = { symbol: 'NVDA', label: 'Nvidia', type: 'stock', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      performanceSignals: [{ percentChange: 4.2, phrase: 'up 4.2%' }],
      sentimentSignals: [
        predictSentimentFromHits(2, 0),
        predictSentimentFromHits(1, 0),
      ],
      macroSignals: [2],
      sourceWeights: [1, 0.98],
    }),
  );

  assert.equal(result.symbol, 'NVDA');
  assert.ok(result.score > 70);
  assert.equal(result.sentimentConfidence.label, 'positive');
  assert.ok(result.sentimentConfidence.confidence > 0.5);
  assert.ok(result.breakdown.sentiment > 0);
  assert.ok(result.breakdown.sentimentConfidenceWeight > 0.5);
});

test('scoreAsset penalizes negative signals', () => {
  const asset: WatchlistAsset = { symbol: 'TSLA', label: 'Tesla', type: 'stock', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      performanceSignals: [{ percentChange: -5.5, phrase: 'down 5.5%' }],
      sentimentSignals: [
        predictSentimentFromHits(0, 2),
        predictSentimentFromHits(0, 1),
      ],
      macroSignals: [-2],
      sourceWeights: [0.82, 0.85],
    }),
  );

  assert.ok(result.score < 50);
  assert.equal(result.sentimentConfidence.label, 'negative');
  assert.ok(result.sentimentConfidence.confidence > 0.5);
  assert.ok(result.breakdown.sentiment < 0);
  assert.ok(result.breakdown.sentimentConfidenceWeight > 0.5);
});

test('scoreAsset dampens low-confidence mixed sentiment', () => {
  const asset: WatchlistAsset = { symbol: 'SPY', label: 'SPDR S&P 500 ETF', type: 'index_fund', aliases: [] };
  const result = scoreAsset(
    asset,
    buildSignals({
      sentimentSignals: [
        predictSentimentFromHits(1, 0),
        predictSentimentFromHits(0, 1),
      ],
      sourceWeights: [1],
    }),
  );

  assert.ok(result.sentimentConfidence.confidence < 0.5);
  assert.ok(result.breakdown.sentimentConfidenceWeight < 0.3);
  assert.equal(result.breakdown.sentiment, 0);
});
