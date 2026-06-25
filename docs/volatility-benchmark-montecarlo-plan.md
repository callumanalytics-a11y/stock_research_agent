# Realised Volatility, Benchmarking, and Monte Carlo Plan

Last updated: 2026-05-28

## Goal

Upgrade the current research model so it uses real market data in a more finance-like way.

The aim is to move away from headline-only scoring and towards a ranking engine that answers:

- how volatile is this asset?
- is it outperforming its benchmark?
- what is the probability of a good or bad outcome over the next few days?

This plan assumes the existing `finance_proj` market-data layer is already in place and working.

## Why this matters

The current model can still produce too many neutral outcomes because headline sentiment is often noisy and weakly directional.

Realised volatility, benchmark-relative strength, and Monte Carlo simulation help in three ways:

- they use actual price history instead of only language signals
- they produce continuous outputs instead of mostly neutral labels
- they are closer to how real financial modelling is done

## Recommended build order

1. Add realised volatility metrics.
2. Add benchmark-relative performance metrics.
3. Blend those into a stronger momentum score.
4. Add Monte Carlo simulation over recent returns.
5. Convert simulation outputs into rankable probabilities.
6. Surface the new inputs in the report and frontend.

## Phase 1: Define the data model

Extend the market-data and scoring types so the new signals are explicit and testable.

Add these concepts to `src/types/models.ts`:

- `RealizedVolatility`
- `BenchmarkComparison`
- `SimulationResult`
- `DistributionSummary`
- `MomentumScoreInputs`

Suggested shapes:

```ts
export interface RealizedVolatility {
  daily: number;
  fiveDay: number;
  twentyDay: number;
}

export interface BenchmarkComparison {
  benchmarkSymbol: string;
  relativeReturn5d: number;
  relativeReturn20d: number;
  beta?: number;
}

export interface DistributionSummary {
  mean: number;
  median: number;
  p05: number;
  p25: number;
  p75: number;
  p95: number;
}

export interface SimulationResult {
  horizonDays: number;
  iterations: number;
  expectedReturn: number;
  probabilityPositive: number;
  probabilityBeatBenchmark: number;
  probabilityLossGt5: number;
  returnDistribution: DistributionSummary;
}
```

## Phase 2: Build realised volatility

Create a helper module for volatility calculations, for example:

- `src/lib/market-data/volatility.ts`

### What to compute

Use the daily close series from the price history to calculate:

- daily realised volatility
- 5-day realised volatility
- 20-day realised volatility

### How to calculate it

Use log returns between closes:

```ts
r_t = ln(close_t / close_{t-1})
```

Then compute:

- standard deviation of log returns
- annualised volatility if needed:

```ts
vol_annualised = stdDev(logReturns) * sqrt(252)
```

For this project, keep the first version simple:

- use non-annualised 20-day realised volatility as the main risk input
- keep annualised volatility as a display-only metric if useful

### Why this is useful

Volatility lets us distinguish:

- calm, steady movers
- noisy, high-risk names

That is more informative than a neutral sentiment label.

## Phase 3: Add benchmark-relative scoring

Create a benchmark comparison module, for example:

- `src/lib/market-data/benchmark.ts`

### Benchmark mapping

Each asset should be compared against a sensible benchmark:

- US large caps -> `SPY`
- Nasdaq-heavy names -> `QQQ`
- UK large caps -> `VUKE`
- Dow-style names -> `DIA`

You can encode this in a helper map in the watchlist config or a dedicated benchmark map.

### What to compute

For each asset, calculate:

- 5-day return
- 20-day return
- benchmark 5-day return
- benchmark 20-day return
- relative return:

```ts
relativeReturn = assetReturn - benchmarkReturn
```

### Optional beta

Later, compute beta against the benchmark using recent returns:

```ts
beta = covariance(assetReturns, benchmarkReturns) / variance(benchmarkReturns)
```

Beta is optional for v1, but useful if you want to distinguish:

- high-beta names that move more than the market
- low-beta names that move less

## Phase 4: Replace simple momentum with risk-adjusted momentum

Update the scoring so momentum is not just raw return.

### Suggested momentum score

Start with:

- 5-day return
- 20-day return
- benchmark-relative return

Then penalise by realised volatility.

Example structure:

```ts
momentumScore =
  (0.4 * fiveDayReturn) +
  (0.4 * twentyDayReturn) +
  (0.2 * relativeReturn20d) -
  (0.3 * realisedVolatility20d)
```

You can then clamp or normalise this into the existing score range.

### Why

This makes the model prefer:

- assets moving up steadily
- assets outperforming their benchmark
- assets with controlled volatility

and penalises:

- sharp but chaotic moves
- names that are just following the market

## Phase 5: Add Monte Carlo simulation

Create a new simulation module, for example:

- `src/lib/market-data/monte-carlo.ts`

### Input data

Use recent daily returns from the price history.

Start with the last 20 to 60 trading days.

### Simulation approach

For each asset:

1. Estimate drift from recent mean return.
2. Estimate volatility from realised returns.
3. Simulate many future price paths.
4. Convert those paths into probabilities and summary statistics.

### Simple first version

Use a geometric Brownian motion style simulation:

```ts
S_{t+1} = S_t * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)
```

Where:

- `mu` = estimated drift
- `sigma` = realised volatility
- `Z` = random normal draw

### Outputs to capture

For a 5-day and 20-day horizon, return:

- expected return
- probability of positive return
- probability of beating the benchmark
- probability of losing more than 5%
- percentiles such as p05, p50, p95

### Why this is useful

This gives you a probability distribution instead of a binary neutral/positive/negative label.

That is much more useful for ranking ideas.

## Phase 6: Score on probabilities, not just direction

Update `src/lib/scoring.ts` so Monte Carlo outputs feed the ranking.

Recommended score inputs:

- `probabilityPositive`
- `probabilityBeatBenchmark`
- `expectedReturn`
- `probabilityLossGt5`
- `realisedVolatility`

Suggested weighting:

- reward higher `probabilityPositive`
- reward higher `probabilityBeatBenchmark`
- reward positive `expectedReturn`
- penalise higher `probabilityLossGt5`
- penalise excessive volatility

Example:

```ts
const probabilisticScore =
  35 * probabilityPositive +
  25 * probabilityBeatBenchmark +
  20 * expectedReturnNormalised -
  15 * probabilityLossGt5 -
   5 * volatilityPenalty;
```

This should be blended with the existing score rather than replacing it all at once.

## Phase 7: Keep news as an event overlay

Do not remove headlines.

Instead, let headlines act as an overlay on top of the market model.

Useful event categories:

- earnings
- guidance
- analyst upgrade or downgrade
- M&A
- regulation / litigation
- macro sensitivity

This is better than generic neutral sentiment because it is more like an event-study input.

## Phase 8: Update the report and frontend

Update:

- `src/lib/report.ts`
- `src/lib/site.ts`
- `src/run-daily.ts`

Show these new fields per asset:

- realised volatility
- benchmark symbol
- relative return vs benchmark
- Monte Carlo expected return
- probability of positive outcome
- probability of beating benchmark
- probability of a >5% loss

That will make the report much more actionable.

## Phase 9: Add configuration

Add a benchmark mapping file, for example:

- `src/config/benchmarks.ts`

Example:

```ts
export const BENCHMARKS = {
  AAPL: 'QQQ',
  MSFT: 'QQQ',
  NVDA: 'QQQ',
  TSLA: 'QQQ',
  SPY: 'SPY',
  VUKE: 'VUKE',
};
```

Also add simulation settings:

- `SIMULATION_ITERATIONS=5000`
- `SIMULATION_HORIZON_DAYS=5`

Keep the defaults small enough for daily runs.

## Phase 10: Add tests

Add tests for:

- log-return calculation
- realised volatility calculation
- benchmark relative return calculation
- Monte Carlo output shape
- simulation stability with fixed seed

Suggested test files:

- `test/volatility.test.ts`
- `test/benchmark.test.ts`
- `test/monte-carlo.test.ts`

Use a deterministic pseudo-random seed for simulation tests so they are stable.

## Phase 11: Add a deterministic RNG

For Monte Carlo tests, introduce a seeded random generator.

That way:

- tests are repeatable
- simulation output is predictable enough to verify

Do not use `Math.random()` directly in tests.

## Phase 12: Practical implementation order

If we want the smallest safe rollout, build it in this order:

1. Volatility helpers.
2. Benchmark mapping.
3. Relative return calculations.
4. Momentum score rewrite.
5. Monte Carlo module.
6. Report and frontend fields.
7. Tests and tuning.

## Suggested file changes

Create:

- `src/lib/market-data/volatility.ts`
- `src/lib/market-data/benchmark.ts`
- `src/lib/market-data/monte-carlo.ts`
- `src/config/benchmarks.ts`
- `test/volatility.test.ts`
- `test/benchmark.test.ts`
- `test/monte-carlo.test.ts`
- `docs/volatility-benchmark-montecarlo-plan.md`

Update:

- `src/types/models.ts`
- `src/lib/scoring.ts`
- `src/run-daily.ts`
- `src/lib/report.ts`
- `src/lib/site.ts`

## Definition of done

This change is done when:

- realised volatility is computed from actual prices
- each asset has a benchmark-relative score
- Monte Carlo outputs probability-style ranking metrics
- the report shows these values clearly
- tests cover the calculations and the simulation path

## Notes

- Black-Scholes is more relevant if you later add options chain data.
- For now, realised volatility + benchmark-relative return + Monte Carlo will likely improve the usefulness of your rankings much more directly.
- Keep the first version simple and deterministic enough to inspect daily.
