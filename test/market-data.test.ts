import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBenchmarkComparison } from '../src/lib/market-data/benchmark.ts';
import { buildMomentumFromBars } from '../src/lib/market-data/alpaca.ts';
import { createEmptyMarketSnapshot, createSnapshotMap } from '../src/lib/market-data/provider.ts';
import { calculateRealizedVolatility } from '../src/lib/market-data/volatility.ts';

test('buildMomentumFromBars computes daily and five-day percent changes', () => {
  const bars = [
    { symbol: 'AAPL', timestamp: '2026-05-01T00:00:00Z', open: 100, high: 101, low: 99, close: 100 },
    { symbol: 'AAPL', timestamp: '2026-05-02T00:00:00Z', open: 101, high: 102, low: 100, close: 101 },
    { symbol: 'AAPL', timestamp: '2026-05-05T00:00:00Z', open: 102, high: 103, low: 101, close: 102 },
    { symbol: 'AAPL', timestamp: '2026-05-06T00:00:00Z', open: 103, high: 104, low: 102, close: 103 },
    { symbol: 'AAPL', timestamp: '2026-05-07T00:00:00Z', open: 104, high: 105, low: 103, close: 104 },
    { symbol: 'AAPL', timestamp: '2026-05-08T00:00:00Z', open: 105, high: 106, low: 104, close: 105 },
  ];

  const momentum = buildMomentumFromBars(bars);

  assert.ok(momentum !== null);
  if (!momentum) {
    throw new Error('Expected momentum to be computed');
  }
  assert.equal(Number(momentum.dailyPercent.toFixed(2)), 0.96);
  assert.equal(Number(momentum.fiveDayPercent.toFixed(2)), 5);
});

test('provider helpers create empty snapshots and maps', () => {
  const snapshot = createEmptyMarketSnapshot('TSLA', 'none', 'missing');
  const map = createSnapshotMap(['TSLA', 'AAPL']);

  assert.equal(snapshot.symbol, 'TSLA');
  assert.equal(snapshot.error, 'missing');
  assert.equal(map.TSLA.provider, 'none');
  assert.equal(map.AAPL.symbol, 'AAPL');
});

test('calculateRealizedVolatility returns 5D and 20D volatility', () => {
  const bars = [
    { symbol: 'AAPL', timestamp: '2026-05-01T00:00:00Z', open: 100, high: 101, low: 99, close: 100 },
    { symbol: 'AAPL', timestamp: '2026-05-02T00:00:00Z', open: 101, high: 102, low: 100, close: 102 },
    { symbol: 'AAPL', timestamp: '2026-05-05T00:00:00Z', open: 102, high: 103, low: 101, close: 101 },
    { symbol: 'AAPL', timestamp: '2026-05-06T00:00:00Z', open: 103, high: 104, low: 102, close: 104 },
    { symbol: 'AAPL', timestamp: '2026-05-07T00:00:00Z', open: 104, high: 105, low: 103, close: 103 },
    { symbol: 'AAPL', timestamp: '2026-05-08T00:00:00Z', open: 105, high: 106, low: 104, close: 105 },
  ];

  const volatility = calculateRealizedVolatility(bars);

  assert.ok(volatility !== null);
  if (!volatility) {
    throw new Error('Expected volatility to be computed');
  }
  assert.ok(volatility.fiveDay >= 0);
  assert.ok(volatility.twentyDay >= 0);
  assert.ok(volatility.annualizedTwentyDay >= volatility.twentyDay);
});

test('buildBenchmarkComparison calculates relative returns', () => {
  const assetBars = [
    { symbol: 'AAPL', timestamp: '2026-05-01T00:00:00Z', open: 100, high: 101, low: 99, close: 100 },
    { symbol: 'AAPL', timestamp: '2026-05-02T00:00:00Z', open: 101, high: 102, low: 100, close: 101 },
    { symbol: 'AAPL', timestamp: '2026-05-05T00:00:00Z', open: 102, high: 103, low: 101, close: 103 },
    { symbol: 'AAPL', timestamp: '2026-05-06T00:00:00Z', open: 103, high: 104, low: 102, close: 104 },
    { symbol: 'AAPL', timestamp: '2026-05-07T00:00:00Z', open: 104, high: 105, low: 103, close: 106 },
    { symbol: 'AAPL', timestamp: '2026-05-08T00:00:00Z', open: 105, high: 106, low: 104, close: 108 },
    { symbol: 'AAPL', timestamp: '2026-05-09T00:00:00Z', open: 106, high: 107, low: 105, close: 110 },
    { symbol: 'AAPL', timestamp: '2026-05-12T00:00:00Z', open: 107, high: 108, low: 106, close: 112 },
    { symbol: 'AAPL', timestamp: '2026-05-13T00:00:00Z', open: 108, high: 109, low: 107, close: 114 },
    { symbol: 'AAPL', timestamp: '2026-05-14T00:00:00Z', open: 109, high: 110, low: 108, close: 116 },
    { symbol: 'AAPL', timestamp: '2026-05-15T00:00:00Z', open: 110, high: 111, low: 109, close: 118 },
    { symbol: 'AAPL', timestamp: '2026-05-16T00:00:00Z', open: 111, high: 112, low: 110, close: 120 },
    { symbol: 'AAPL', timestamp: '2026-05-19T00:00:00Z', open: 112, high: 113, low: 111, close: 122 },
    { symbol: 'AAPL', timestamp: '2026-05-20T00:00:00Z', open: 113, high: 114, low: 112, close: 124 },
    { symbol: 'AAPL', timestamp: '2026-05-21T00:00:00Z', open: 114, high: 115, low: 113, close: 126 },
    { symbol: 'AAPL', timestamp: '2026-05-22T00:00:00Z', open: 115, high: 116, low: 114, close: 128 },
    { symbol: 'AAPL', timestamp: '2026-05-23T00:00:00Z', open: 116, high: 117, low: 115, close: 130 },
    { symbol: 'AAPL', timestamp: '2026-05-26T00:00:00Z', open: 117, high: 118, low: 116, close: 132 },
    { symbol: 'AAPL', timestamp: '2026-05-27T00:00:00Z', open: 118, high: 119, low: 117, close: 134 },
    { symbol: 'AAPL', timestamp: '2026-05-28T00:00:00Z', open: 119, high: 120, low: 118, close: 136 },
    { symbol: 'AAPL', timestamp: '2026-05-29T00:00:00Z', open: 120, high: 121, low: 119, close: 138 },
  ];

  const benchmarkBars = assetBars.map((bar, index) => ({
    ...bar,
    close: bar.close - 2 + index * 0.1,
    symbol: 'QQQ',
  }));

  const comparison = buildBenchmarkComparison('AAPL', assetBars, 'QQQ', benchmarkBars);

  assert.ok(comparison !== null);
  if (!comparison) {
    throw new Error('Expected benchmark comparison');
  }
  assert.equal(comparison.benchmarkSymbol, 'QQQ');
  assert.ok(Number.isFinite(comparison.relativeReturn5d));
  assert.ok(Number.isFinite(comparison.relativeReturn20d));
});
