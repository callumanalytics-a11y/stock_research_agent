import { AlpacaMarketDataClient } from './alpaca.ts';
import { createSnapshotMap } from './provider.ts';
import type { MarketDataClient } from './types.ts';
import type { MarketDataProvider, MarketDataSnapshot } from '../../types/models.ts';

function providerFromEnv(): MarketDataProvider {
  const value = process.env?.MARKET_DATA_PROVIDER?.toLowerCase();
  if (value === 'alpaca') {
    return 'alpaca';
  }

  return 'none';
}

function createClient(provider: MarketDataProvider): MarketDataClient | null {
  if (provider === 'alpaca') {
    return new AlpacaMarketDataClient();
  }

  return null;
}

export async function getMarketDataSnapshots(symbols: string[]): Promise<Record<string, MarketDataSnapshot>> {
  const provider = providerFromEnv();
  const client = createClient(provider);

  if (!client) {
    return createSnapshotMap(symbols, 'none');
  }

  return client.getSnapshots(symbols);
}
