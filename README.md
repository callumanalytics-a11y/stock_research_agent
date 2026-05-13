# Finance Research Agent

A Playwright-powered research agent that:

- visits finance and news publication pages
- extracts daily stock-performance snippets and major headlines
- optionally fetches market prices from Alpaca
- maps those signals to a configurable watchlist of stocks and index funds
- produces a transparent weighted score for research prioritisation

## What this is for

This project is designed for daily idea generation and ranking, not automated trading or financial advice. The score is intentionally explainable so you can adjust the weights, sources, and watchlist over time.

## How it works

1. Open configured publication pages such as FT, City AM, Investors' Chronicle, MoneyWeek, Reuters, and Yahoo Finance UK.
2. Collect headline-like text from the page and look for price-action language such as `up 4.2%`, `shares fall`, or `stocks jump`.
3. Optionally fetch real market data for the watchlist from Alpaca.
4. Match headlines against a watchlist of stocks and ETFs using names, aliases, and tickers.
5. Score each candidate based on:
   - market momentum when available
   - headline momentum as fallback
   - headline sentiment
   - source credibility
   - macro tailwinds
   - risk penalties
6. Write results to `output/latest-report.json`, `output/latest-report.md`, and `output/site/`.

## Run

From `finance_proj`:

```bash
npm run daily
```

To rebuild the website from the latest JSON report without scraping again:

```bash
npm run site
```

If Playwright browsers are not installed yet in your environment:

```bash
npx playwright install chromium
```

## Market data setup

The project can use Alpaca market data for real price-based momentum.

1. Copy `.env.example` to your own env file or export the variables in your shell.
2. Set:
   - `MARKET_DATA_PROVIDER=alpaca`
   - `ALPACA_API_KEY`
   - `ALPACA_API_SECRET`
3. Run `npm run daily`

If Alpaca credentials are not configured, the app still works and falls back to headline-based momentum.

## Customize

- Edit the source list in `src/config/sources.ts`
- Edit the watchlist in `src/config/watchlist.ts`
- Tune weights in `src/lib/scoring.ts`
- Review the market-data integration plan in `docs/market-data-integration-plan.md`

## Notes

- Sites with strict paywalls may expose only partial headline text.
- CSS structures change often, so selectors and heuristics will need occasional maintenance.
- Alpaca market data requires credentials and may still return partial coverage or rate-limited responses.
- The output should be treated as a research shortlist for human review.
