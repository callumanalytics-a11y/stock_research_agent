import { createEmptyMarketSnapshot } from './provider.ts';
import type { MarketDataClient } from './types.ts';
import type { MarketBar, MarketDataSnapshot, MarketMomentum, MarketQuote } from '../../types/models.ts';

const ALPACA_BASE_URL = 'https://data.alpaca.markets';

interface AlpacaBarResponse {
  bars?: Record<string, Array<{
    t: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v?: number;
  }>>;
}

function getAlpacaCredentials(): { key: string; secret: string } | null {
  const key = process.env?.ALPACA_API_KEY;
  const secret = process.env?.ALPACA_API_SECRET;

  if (!key || !secret) {
    return null;
  }

  return { key, secret };
}

function buildHeaders(credentials: { key: string; secret: string }): Record<string, string> {
  return {
    'APCA-API-KEY-ID': credentials.key,
    'APCA-API-SECRET-KEY': credentials.secret,
  };
}

function buildBarsUrl(symbols: string[]): string {
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 30);

  const params = new URLSearchParams({
    symbols: symbols.join(','),
    timeframe: '1Day',
    start: start.toISOString(),
    end: now.toISOString(),
    limit: '30',
    adjustment: 'raw',
    feed: 'iex',
    sort: 'asc',
  });

  return `${ALPACA_BASE_URL}/v2/stocks/bars?${params.toString()}`;
}

function toMarketBar(symbol: string, bar: { t: string; o: number; h: number; l: number; c: number; v?: number }): MarketBar {
  return {
    symbol,
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  };
}

export function buildMomentumFromBars(bars: MarketBar[]): MarketMomentum | null {
  if (bars.length < 2) {
    return null;
  }

  const latestBar = bars[bars.length - 1];
  const previousBar = bars[bars.length - 2];
  const fiveDayBar = bars.length >= 6 ? bars[bars.length - 6] : bars[0];

  if (!latestBar || !previousBar || !fiveDayBar) {
    return null;
  }

  const dailyPercent = ((latestBar.close - previousBar.close) / previousBar.close) * 100;
  const fiveDayPercent = ((latestBar.close - fiveDayBar.close) / fiveDayBar.close) * 100;

  return {
    dailyPercent,
    fiveDayPercent,
  };
}

function buildQuote(symbol: string, bars: MarketBar[]): MarketQuote | null {
  if (bars.length < 2) {
    return null;
  }

  const latestBar = bars[bars.length - 1];
  const previousBar = bars[bars.length - 2];
  const changePercent = ((latestBar.close - previousBar.close) / previousBar.close) * 100;

  return {
    symbol,
    lastPrice: latestBar.close,
    previousClose: previousBar.close,
    changePercent,
    asOf: latestBar.timestamp,
    provider: 'alpaca',
  };
}

export class AlpacaMarketDataClient implements MarketDataClient {
  async getSnapshot(symbol: string): Promise<MarketDataSnapshot> {
    const snapshots = await this.getSnapshots([symbol]);
    return snapshots[symbol] ?? createEmptyMarketSnapshot(symbol, 'alpaca', 'No data returned');
  }

  async getSnapshots(symbols: string[]): Promise<Record<string, MarketDataSnapshot>> {
    const credentials = getAlpacaCredentials();

    if (!credentials) {
      return Object.fromEntries(
        symbols.map((symbol) => [symbol, createEmptyMarketSnapshot(symbol, 'none', 'Alpaca credentials not configured')]),
      );
    }

    try {
      const response = await fetch(buildBarsUrl(symbols), {
        headers: buildHeaders(credentials),
      });

      if (!response.ok) {
        const body = await response.text();
        return Object.fromEntries(
          symbols.map((symbol) => [
            symbol,
            createEmptyMarketSnapshot(symbol, 'alpaca', `Alpaca request failed: ${response.status} ${body}`),
          ]),
        );
      }

      const payload = (await response.json()) as AlpacaBarResponse;

      return Object.fromEntries(
        symbols.map((symbol) => {
          const bars = (payload.bars?.[symbol] ?? []).map((bar) => toMarketBar(symbol, bar));
          const momentum = buildMomentumFromBars(bars);
          const quote = buildQuote(symbol, bars);

          return [
            symbol,
            {
              symbol,
              provider: 'alpaca',
              quote,
              bars,
              momentum,
              error: bars.length === 0 ? 'No Alpaca bars returned' : null,
            },
          ];
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Object.fromEntries(
        symbols.map((symbol) => [symbol, createEmptyMarketSnapshot(symbol, 'alpaca', message)]),
      );
    }
  }
}
