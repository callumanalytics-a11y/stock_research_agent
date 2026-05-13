import type { MarketDataSnapshot } from '../../types/models.ts';

export interface MarketDataClient {
  getSnapshot(symbol: string): Promise<MarketDataSnapshot>;
  getSnapshots(symbols: string[]): Promise<Record<string, MarketDataSnapshot>>;
}
