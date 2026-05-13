import type { MarketDataProvider, MarketDataSnapshot } from '../../types/models.ts';

export function createEmptyMarketSnapshot(
  symbol: string,
  provider: MarketDataProvider = 'none',
  error: string | null = null,
): MarketDataSnapshot {
  return {
    symbol,
    provider,
    quote: null,
    bars: [],
    momentum: null,
    error,
  };
}

export function createSnapshotMap(symbols: string[], provider: MarketDataProvider = 'none'): Record<string, MarketDataSnapshot> {
  return Object.fromEntries(symbols.map((symbol) => [symbol, createEmptyMarketSnapshot(symbol, provider)]));
}
