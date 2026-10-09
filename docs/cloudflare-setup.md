# Cloudflare Workers Setup

This project uses Cloudflare Workers Static Assets for hosting and GitHub Actions for the Node/Playwright report generation.

## Why the deployment is split

Cloudflare serves the generated files in `output/site`. GitHub Actions runs `npm run daily`, because the analysis pipeline needs Node.js and Playwright. The workflow commits the refreshed `output/` files, and Cloudflare Workers Builds deploys that commit.

## First deployment

1. Commit and push `wrangler.jsonc`, `worker/index.ts`, `.github/workflows/daily-report.yml`, and the generated `output/site` files to the branch Cloudflare will build.
2. In Cloudflare Workers, import the GitHub repository at its repository root.
3. Set the production branch to `dev` while this project is being developed.
4. Make sure the Cloudflare Worker name is `stock-research-agent`, matching `name` in `wrangler.jsonc`.
5. Set the deploy command to `npx wrangler deploy` or `npm run cf:deploy`.
6. Leave the build command empty. The generated static site is already committed by the report workflow.
7. Confirm the asset directory is `./output/site`, as configured in `wrangler.jsonc`.

Cloudflare Workers Builds requires the Worker name in the dashboard to match the `name` in the Wrangler configuration. It also needs the Wrangler configuration to be present in the connected branch before the first build.

## Runtime variables and secrets

Add these as Worker runtime secrets or variables in Cloudflare:

- `GITHUB_ACTIONS_TOKEN`: fine-grained GitHub token with Actions write permission for this repository.
- `GITHUB_REPOSITORY`: `callumanalytics-a11y/stock_research_agent`.
- `GITHUB_WORKFLOW`: `daily-report.yml`.
- `GITHUB_REF`: `dev`.
- `ACCESS_TEAM_DOMAIN`: your Cloudflare Access team URL, such as `https://your-team.cloudflareaccess.com`.
- `ACCESS_AUDIENCE`: the Access Application Audience tag for the protected trigger application.
- `SITE_ORIGIN`: the public site origin, such as `https://research.example.com`.

Protect `/api/run-report` with a Cloudflare Access self-hosted application. The Worker validates the Access JWT signature, issuer, audience, expiry, and request origin before dispatching GitHub Actions.

## GitHub Actions secrets

Add the market-data secrets to GitHub Actions if Alpaca is used. Yahoo Finance is the default provider and does not require credentials:

- `ALPACA_API_KEY`
- `ALPACA_API_SECRET`

The workflow is intentionally not deploying to Cloudflare directly. A successful report run commits `output/`, which triggers the connected Cloudflare Workers Build and deployment.
