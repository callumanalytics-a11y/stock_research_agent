import type { BenchmarkComparison, MarketBar } from '../../types/models.ts';
import { getReturnOverLookback } from './volatility.ts';

export function buildBenchmarkComparison(
  assetSymbol: string,
  assetBars: MarketBar[],
  benchmarkSymbol: string,
  benchmarkBars: MarketBar[],
): BenchmarkComparison | null {
  const assetFiveDayReturn = getReturnOverLookback(assetBars, 5);
  const assetTwentyDayReturn = getReturnOverLookback(assetBars, 20);
  const benchmarkFiveDayReturn = getReturnOverLookback(benchmarkBars, 5);
  const benchmarkTwentyDayReturn = getReturnOverLookback(benchmarkBars, 20);

  if (
    assetFiveDayReturn === null ||
    assetTwentyDayReturn === null ||
    benchmarkFiveDayReturn === null ||
    benchmarkTwentyDayReturn === null
  ) {
    return null;
  }

  return {
    benchmarkSymbol,
    assetFiveDayReturn,
    assetTwentyDayReturn,
    benchmarkFiveDayReturn,
    benchmarkTwentyDayReturn,
    relativeReturn5d: assetFiveDayReturn - benchmarkFiveDayReturn,
    relativeReturn20d: assetTwentyDayReturn - benchmarkTwentyDayReturn,
  };
}
