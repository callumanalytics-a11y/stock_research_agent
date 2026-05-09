# Market Data Integration Plan

Last updated: 2026-05-09

## Goal

Add free or low-cost market price data to the report pipeline so the project uses actual market data for momentum instead of relying only on publication headlines.

This plan is written for the current `finance_proj` architecture and focuses on adding:

- latest quote data
- short-term price momentum
- a clean abstraction layer so the provider can be swapped later

## Recommended approach

Use **Alpaca** as the primary production integration and treat **yfinance** as an optional prototype or fallback.

Why:

- Alpaca has an official market data product with HTTP and WebSocket support.
- Alpaca’s Basic trading plan is free and currently includes real-time equities data from IEX plus historical access with limits.
- `yfinance` is convenient, but it is an unofficial open-source wrapper around Yahoo Finance data and its own README says it is intended for research and personal use.

## Provider notes

### Option 1: Alpaca

Best for:

- production-ish use
- clearer rate limits
- cleaner legal/operational footing
- future real-time streaming

Current official notes I verified:

- Alpaca’s Market Data API supports HTTP and WebSocket access.
- The free Basic Trading API plan includes real-time equities data from IEX.
- Historical stock data is available, with Basic plan limits.
- Authentication uses `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`.

### Option 2: yfinance

Best for:

- fast prototyping
- zero signup prototype path
- simple historical download workflows

Current official notes I verified:

- `yfinance` is an open-source tool, not an official Yahoo product.
- Its README says it is intended for research and educational purposes.
- The Yahoo Finance API usage is described there as intended for personal use only.

## What we should build

We should add a new **market data layer** that sits beside the scraper layer.

Target flow:

1. Scrape news/publications as we do now.
2. Fetch current and recent price data for every watchlist ticker.
3. Compute real momentum metrics from market prices.
4. Merge market data and headline data into one scoring input.
5. Update the report and frontend to show:
   - last price
   - daily move
   - 5-day move
   - momentum contribution
   - data provider used

## Step-by-step implementation plan

### Phase 1: Add typed market-data models

Create new types in `src/types/models.ts` for market data.

Add:

- `MarketQuote`
- `MarketBar`
- `MarketMomentum`
- `MarketDataSnapshot`
- `MarketDataProvider`

Suggested shapes:

```ts
export interface MarketQuote {
  symbol: string;
  lastPrice: number;
  previousClose?: number;
  changePercent?: number;
  asOf: string;
  provider: string;
}

export interface MarketBar {
  symbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketMomentum {
  dailyPercent: number;
  fiveDayPercent: number;
  twentyDayPercent?: number;
}

export interface MarketDataSnapshot {
  quote: MarketQuote | null;
  bars: MarketBar[];
  momentum: MarketMomentum | null;
}
```

### Phase 2: Add a provider abstraction

Create:

- `src/lib/market-data/types.ts`
- `src/lib/market-data/provider.ts`

Define a simple provider interface:

```ts
export interface MarketDataClient {
  getSnapshot(symbol: string): Promise<MarketDataSnapshot>;
  getSnapshots(symbols: string[]): Promise<Record<string, MarketDataSnapshot>>;
}
```

Why:

- keeps the rest of the app independent of Alpaca vs yfinance
- makes testing much easier
- lets us add fallback providers later

### Phase 3: Implement Alpaca client first

Create:

- `src/lib/market-data/alpaca.ts`

Responsibilities:

- read Alpaca credentials from env
- fetch latest quote or latest bar
- fetch recent daily bars
- compute momentum values
- normalize all data into our shared internal types

Environment variables to add:

- `ALPACA_API_KEY`
- `ALPACA_API_SECRET`

Suggested helper functions:

- `getAlpacaHeaders()`
- `fetchLatestBar(symbol)`
- `fetchDailyBars(symbol, days)`
- `buildMomentumFromBars(bars)`

For the first version, keep it simple:

- use daily bars rather than tick-level quotes
- compute momentum from closes
- avoid WebSockets until the batch version works

### Phase 4: Add optional yfinance fallback

Create:

- `src/lib/market-data/yfinance.ts`

Use this only if you want a no-account prototype path.

Important constraint:

- treat it as prototype/research only unless you are comfortable with its legal and operational caveats

If you add it, expose it behind a config switch:

- `MARKET_DATA_PROVIDER=alpaca`
- `MARKET_DATA_PROVIDER=yfinance`

### Phase 5: Add a market-data service layer

Create:

- `src/lib/market-data/service.ts`

Responsibilities:

- choose provider from config
- batch-fetch market data for the full watchlist
- handle retries and partial failures
- return a single symbol-to-snapshot map

This is where we should also:

- throttle requests
- cache responses for one run
- degrade gracefully if a provider fails for some symbols

### Phase 6: Compute real momentum

Replace headline-derived momentum as the primary momentum signal.

Proposed calculation:

- `dailyPercent = ((latestClose - previousClose) / previousClose) * 100`
- `fiveDayPercent = ((latestClose - close5dAgo) / close5dAgo) * 100`

Suggested scoring approach:

- use daily momentum for short-term movement
- use 5-day momentum for trend confirmation
- average or combine them with a weighted blend

Example:

```ts
const momentumBlend = dailyPercent * 0.6 + fiveDayPercent * 0.4;
```

Then feed that into `normalizeMomentum()`.

### Phase 7: Update scoring inputs

Extend `AssetSignals` in `src/types/models.ts` to include market data:

```ts
marketQuote: MarketQuote | null;
marketMomentum: MarketMomentum | null;
```

Then update `buildSignalsForAsset()` in `src/run-daily.ts` to attach market data from the fetched snapshot map.

### Phase 8: Update scoring logic

Update `src/lib/scoring.ts` so momentum comes from real prices first.

Recommended rule:

- if market momentum is available, use it as the main momentum source
- keep headline-extracted momentum as fallback only

Suggested logic:

1. Prefer `marketMomentum.dailyPercent`
2. Blend with `fiveDayPercent`
3. Fall back to headline price phrases if no market data exists

This keeps the app resilient when the API misses a ticker.

### Phase 9: Update the report output

Update:

- `src/lib/report.ts`
- `src/lib/site.ts`

Add visible fields for:

- last price
- daily % move
- 5-day % move
- momentum source: `market data` or `headline fallback`
- provider: `alpaca` or `yfinance`

Suggested frontend labels:

- `Last price`
- `1D move`
- `5D move`
- `Momentum source`

### Phase 10: Add config and secrets handling

Add:

- `.env.example`

Example:

```bash
MARKET_DATA_PROVIDER=alpaca
ALPACA_API_KEY=your_key_here
ALPACA_API_SECRET=your_secret_here
```

Then update the README with:

- setup steps
- required env vars
- provider selection

### Phase 11: Add tests

Add tests for:

- momentum calculation from bars
- provider response normalization
- fallback behavior when API data is missing
- score changes when real momentum is present

Suggested test files:

- `test/market-data.test.ts`
- `test/momentum.test.ts`

Mock the provider response instead of calling the live API in tests.

### Phase 12: Add caching and rate-limit protection

Before doing anything real-time, add basic protections.

At minimum:

- one in-memory cache per run
- batch fetch symbols instead of one-by-one where possible
- retry once on transient failure
- log symbols that failed instead of failing the whole report

This matters especially if you later use Yahoo-backed tooling or stricter free tiers.

### Phase 13: Optional real-time/streaming upgrade

Only after the batch version is stable:

- add Alpaca WebSocket streaming for live quotes
- write a `live-site` mode
- refresh the frontend periodically

This should be a second phase, not part of the initial integration.

## Recommended implementation order

If we want the lowest-risk path, do it in this order:

1. Add market-data types.
2. Add provider abstraction.
3. Implement Alpaca batch historical/daily bars client.
4. Compute daily + 5-day momentum.
5. Feed it into scoring.
6. Show it in JSON/Markdown/site.
7. Add tests.
8. Add optional yfinance fallback only if needed.

## Practical design decisions

### Decision 1: Prefer daily bars over quotes for v1

Reason:

- easier to reason about
- enough to build momentum
- less noisy than live ticks
- simpler than streaming

### Decision 2: Keep news sentiment and market momentum separate

Reason:

- they answer different questions
- sentiment says what headlines imply
- momentum says what price is actually doing

### Decision 3: Show provider provenance in the report

Reason:

- helps debugging
- makes trust assumptions visible
- avoids confusion if one day the provider changes

## Suggested file changes

Create:

- `docs/market-data-integration-plan.md`
- `src/lib/market-data/provider.ts`
- `src/lib/market-data/service.ts`
- `src/lib/market-data/alpaca.ts`
- `src/lib/market-data/yfinance.ts` optional
- `test/market-data.test.ts`

Update:

- `src/types/models.ts`
- `src/run-daily.ts`
- `src/lib/scoring.ts`
- `src/lib/report.ts`
- `src/lib/site.ts`
- `README.md`

## Risks and caveats

### Alpaca

- free plan market coverage is limited for real-time equities
- authentication is required
- rate limits still matter

### yfinance

- unofficial
- intended for research/personal use
- response behavior can change unexpectedly

## My recommendation

Build this in two stages.

### Stage 1

Use Alpaca daily bars to replace momentum with real market data.

This gives you:

- better momentum
- cleaner provenance
- minimal UI changes

### Stage 2

Add optional yfinance fallback and, only later, live streaming.

## Definition of done

This task is complete when:

1. Each ranked asset includes actual market-derived momentum.
2. The score prefers market momentum over headline-inferred momentum.
3. The report/site show last price and recent % moves.
4. The provider is configurable.
5. The pipeline still works if market data fails for some symbols.
6. Tests cover normalization and momentum calculations.

## Sources

- Alpaca Market Data API docs: https://docs.alpaca.markets/docs/about-market-data-api
- Alpaca getting started guide: https://docs.alpaca.markets/docs/getting-started-with-alpaca-market-data
- yfinance GitHub README: https://github.com/ranaroussi/yfinance
