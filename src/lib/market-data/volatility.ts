import type { MarketBar, RealizedVolatility } from '../../types/models.ts';

function logReturn(previousClose: number, currentClose: number): number {
  return Math.log(currentClose / previousClose);
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function returnsFromBars(bars: MarketBar[]): number[] {
  const returns: number[] = [];

  for (let index = 1; index < bars.length; index += 1) {
    const previous = bars[index - 1];
    const current = bars[index];

    if (!previous || !current || previous.close <= 0 || current.close <= 0) {
      continue;
    }

    returns.push(logReturn(previous.close, current.close));
  }

  return returns;
}

function windowVolatility(returns: number[]): number {
  return standardDeviation(returns) * 100;
}

export function calculateRealizedVolatility(bars: MarketBar[]): RealizedVolatility | null {
  if (bars.length < 2) {
    return null;
  }

  const returns = returnsFromBars(bars);

  if (returns.length === 0) {
    return null;
  }

  const fiveDay = windowVolatility(returns.slice(-5));
  const twentyDay = windowVolatility(returns.slice(-20));

  return {
    fiveDay,
    twentyDay,
    annualizedTwentyDay: twentyDay * Math.sqrt(252),
  };
}

export function getReturnOverLookback(bars: MarketBar[], lookbackDays: number): number | null {
  if (bars.length <= lookbackDays) {
    return null;
  }

  const latest = bars[bars.length - 1];
  const prior = bars[bars.length - 1 - lookbackDays];

  if (!latest || !prior || prior.close <= 0) {
    return null;
  }

  return ((latest.close - prior.close) / prior.close) * 100;
}
