# Finance Research Agent

A Playwright-powered research agent that:

- visits finance and news publication pages
- extracts daily stock-performance snippets and major headlines
- maps those signals to a configurable watchlist of stocks and index funds
- produces a transparent weighted score for research prioritisation

## What this is for

This project is designed for daily idea generation and ranking, not automated trading or financial advice. The score is intentionally explainable so you can adjust the weights, sources, and watchlist over time.

## How it works

1. Open configured publication pages such as FT, City AM, Reuters, and CNBC.
2. Collect headline-like text from the page and look for price-action language such as `up 4.2%`, `shares fall`, or `stocks jump`.
3. Match headlines against a watchlist of stocks and ETFs using names, aliases, and tickers.
4. Score each candidate based on:
   - performance momentum
   - headline sentiment
   - source credibility
   - macro tailwinds
   - risk penalties
5. Write results to `output/latest-report.json` and `output/latest-report.md`.

## Run

From `finance_proj`:

```bash
npm run daily
```

If Playwright browsers are not installed yet in your environment:

```bash
npx playwright install chromium
```

## Customize

- Edit the source list in `src/config/sources.js`
- Edit the watchlist in `src/config/watchlist.js`
- Tune weights in `src/lib/scoring.js`

## Notes

- Sites with strict paywalls may expose only partial headline text.
- CSS structures change often, so selectors and heuristics will need occasional maintenance.
- The output should be treated as a research shortlist for human review.
