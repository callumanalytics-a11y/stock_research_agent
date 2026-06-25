import { buildMomentumFromBars } from './alpaca.ts';
import { createEmptyMarketSnapshot } from './provider.ts';
import type { MarketDataClient } from './types.ts';
import type { MarketBar, MarketDataSnapshot, MarketQuote } from '../../types/models.ts';

const YAHOO_CHART_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_SYMBOL_ALIASES: Record<string, string> = {
  VUKE: 'VUKE.L',
  VUSA: 'VUSA.L',
};

interface YahooChartResponse {
  chart?: {
    error?: { description?: string } | null;
    result?: YahooChartResult[];
  };
}

interface YahooChartResult {
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    regularMarketTime?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
}

export function buildYahooUrl(symbol: string): string {
  const yahooSymbol = YAHOO_SYMBOL_ALIASES[symbol] ?? symbol;
  const params = new URLSearchParams({
    interval: '1d',
    range: '1mo',
    includePrePost: 'false',
    events: 'div,splits',
  });

  return `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(yahooSymbol)}?${params.toString()}`;
}

function toIsoTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

function toBars(symbol: string, payload: YahooChartResult[]): MarketBar[] {
  const result = payload?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const opens = quote?.open ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const closes = quote?.close ?? [];
  const volumes = quote?.volume ?? [];

  const bars: MarketBar[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index];
    const open = opens[index];
    const high = highs[index];
    const low = lows[index];
    const close = closes[index];

    if (timestamp === undefined || open == null || high == null || low == null || close == null) {
      continue;
    }

    bars.push({
      symbol,
      timestamp: toIsoTimestamp(timestamp),
      open,
      high,
      low,
      close,
      volume: volumes[index] ?? undefined,
    });
  }

  return bars;
}

function buildQuote(symbol: string, payload: YahooChartResult[], bars: MarketBar[]): MarketQuote | null {
  const result = payload?.[0];
  const meta = result?.meta;
  const latestBar = bars[bars.length - 1];

  if (!meta || !latestBar) {
    return null;
  }

  const lastPrice = meta.regularMarketPrice ?? latestBar.close;
  const previousClose = meta.previousClose;
  const changePercent =
    previousClose && previousClose !== 0
      ? ((lastPrice - previousClose) / previousClose) * 100
      : undefined;
  const asOf = meta.regularMarketTime ? toIsoTimestamp(meta.regularMarketTime) : latestBar.timestamp;

  return {
    symbol,
    lastPrice,
    previousClose,
    changePercent,
    asOf,
    provider: 'yfinance',
  };
}

export class YahooFinanceMarketDataClient implements MarketDataClient {
  async getSnapshot(symbol: string): Promise<MarketDataSnapshot> {
    const snapshots = await this.getSnapshots([symbol]);
    return snapshots[symbol] ?? createEmptyMarketSnapshot(symbol, 'yfinance', 'No Yahoo Finance data returned');
  }

  async getSnapshots(symbols: string[]): Promise<Record<string, MarketDataSnapshot>> {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const response = await fetch(buildYahooUrl(symbol));

          if (!response.ok) {
            const body = await response.text();
            return [symbol, createEmptyMarketSnapshot(symbol, 'yfinance', `Yahoo Finance request failed: ${response.status} ${body}`)] as const;
          }

          const payload = (await response.json()) as YahooChartResponse;
          const chart = payload.chart;
          const result = chart?.result;
          const errorDescription = chart?.error?.description;

          if (!result || result.length === 0) {
            return [symbol, createEmptyMarketSnapshot(symbol, 'yfinance', errorDescription ?? 'No Yahoo Finance results returned')] as const;
          }

          const bars = toBars(symbol, result);
          const momentum = buildMomentumFromBars(bars);
          const quote = buildQuote(symbol, result, bars);

          return [
            symbol,
            {
              symbol,
              provider: 'yfinance',
              quote,
              bars,
              momentum,
              error: bars.length === 0 ? 'No Yahoo Finance bars returned' : null,
            },
          ] as const;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return [symbol, createEmptyMarketSnapshot(symbol, 'yfinance', message)] as const;
        }
      }),
    );

    return Object.fromEntries(entries);
  }
}
