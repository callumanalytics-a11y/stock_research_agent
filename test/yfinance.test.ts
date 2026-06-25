import assert from 'node:assert/strict';
import test from 'node:test';
import { buildYahooUrl } from '../src/lib/market-data/yfinance.ts';

test('yfinance fallback normalizes UK ETF symbols', () => {
  assert.ok(/VUKE\.L/.test(buildYahooUrl('VUKE')));
  assert.ok(/VUSA\.L/.test(buildYahooUrl('VUSA')));
  assert.ok(/AAPL/.test(buildYahooUrl('AAPL')));
});
