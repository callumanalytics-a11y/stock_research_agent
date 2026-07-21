export const BENCHMARKS: Record<string, string> = {
  AAPL: 'QQQ',
  MSFT: 'QQQ',
  NVDA: 'QQQ',
  AMZN: 'QQQ',
  GOOGL: 'QQQ',
  META: 'QQQ',
  TSLA: 'QQQ',
  SPY: 'SPY',
  QQQ: 'SPY',
  DIA: 'SPY',
  VUSA: 'SPY',
  VUKE: 'SPY',
};

export function getBenchmarkSymbol(symbol: string): string | null {
  return BENCHMARKS[symbol] ?? null;
}
