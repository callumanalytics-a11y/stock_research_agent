import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMomentumFromBars } from '../src/lib/market-data/alpaca.ts';
import { createEmptyMarketSnapshot, createSnapshotMap } from '../src/lib/market-data/provider.ts';

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
