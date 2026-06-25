import type { DailyReport, SiteAssets } from '../types/models.ts';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function serializeReport(report: DailyReport): string {
  return JSON.stringify(report).replaceAll('<', '\\u003c').replaceAll('</script', '<\\/script');
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(value));
}

function buildHtmlShell(report: DailyReport): string {
  const title = `Market Signal Ledger - ${formatDate(report.generatedAt)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta
      name="description"
      content="A daily market research report with ranked stocks and index funds, finance-event scoring, and publication coverage."
    />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <header class="masthead">
        <div class="masthead-copy">
          <p class="kicker">Market Signal Ledger</p>
          <h1>Daily research, arranged like a desk note instead of a dashboard toy.</h1>
          <p class="lede">
            Market-led equity and ETF ideas with finance-event scoring from financial publication headlines, with transparent scoring and source coverage.
          </p>
        </div>
        <div class="masthead-meta">
          <div class="meta-card">
            <span class="meta-label">Published</span>
            <strong id="published-at"></strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">Assets Ranked</span>
            <strong id="asset-count"></strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">Sources Tracked</span>
            <strong id="source-count"></strong>
          </div>
        </div>
      </header>

      <main class="layout">
        <section class="hero-panel" id="hero-panel"></section>

        <section class="overview-grid">
          <article class="overview-card">
            <p class="section-label">Event mix</p>
            <div id="event-overview" class="pill-row"></div>
          </article>
          <article class="overview-card">
            <p class="section-label">Quick filters</p>
            <div class="filter-row" id="filters"></div>
          </article>
        </section>

        <section>
          <div class="section-head">
            <div>
              <p class="section-label">Ranked ideas</p>
              <h2>Research queue</h2>
            </div>
            <p class="section-note">Sorted by weighted score. Cards show event confidence, score drivers, and supporting headlines.</p>
          </div>
          <div id="asset-grid" class="asset-grid"></div>
        </section>

        <section class="two-column">
          <article class="panel">
            <div class="section-head compact">
              <div>
                <p class="section-label">Coverage</p>
                <h2>Publication ledger</h2>
              </div>
            </div>
            <div id="source-list" class="source-list"></div>
          </article>

          <article class="panel">
            <div class="section-head compact">
              <div>
                <p class="section-label">Market noise</p>
                <h2>Headline tape</h2>
              </div>
            </div>
            <div id="headline-list" class="headline-list"></div>
          </article>
        </section>
      </main>
    </div>

    <script id="report-data" type="application/json">${serializeReport(report)}</script>
    <script type="module" src="./app.js"></script>
  </body>
</html>`;
}

function buildStyles(): string {
  return `:root {
  --bg: #f4efe5;
  --panel: rgba(255, 252, 246, 0.86);
  --panel-strong: #fffaf1;
  --text: #1f2a2a;
  --muted: #6c746d;
  --line: rgba(31, 42, 42, 0.12);
  --green: #1d5c4a;
  --green-soft: #dceee2;
  --red: #9f4a39;
  --red-soft: #f3dfd9;
  --amber: #9f6e2f;
  --amber-soft: #f5ead4;
  --ink: #15201f;
  --shadow: 0 24px 60px rgba(31, 42, 42, 0.12);
  --radius: 24px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  background:
    radial-gradient(circle at top left, rgba(29, 92, 74, 0.14), transparent 28%),
    radial-gradient(circle at top right, rgba(159, 110, 47, 0.18), transparent 24%),
    linear-gradient(180deg, #f8f4ea 0%, var(--bg) 100%);
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(21, 32, 31, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(21, 32, 31, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 88%);
}

.page-shell {
  width: min(1200px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0 56px;
}

.masthead {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 24px;
  align-items: stretch;
  margin-bottom: 28px;
}

.masthead-copy,
.masthead-meta,
.hero-panel,
.overview-card,
.panel,
.asset-card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
}

.masthead-copy {
  padding: 30px;
}

.kicker,
.section-label {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  color: var(--muted);
}

.masthead h1,
.section-head h2,
.hero-title,
.asset-title {
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
}

.masthead h1 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(2.6rem, 5vw, 4.6rem);
  line-height: 0.95;
}

.lede {
  margin: 18px 0 0;
  max-width: 56ch;
  color: var(--muted);
  font-size: 1.02rem;
  line-height: 1.7;
}

.masthead-meta {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.meta-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 110px;
  padding: 20px 22px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 250, 241, 0.8));
  border: 1px solid rgba(21, 32, 31, 0.08);
}

.meta-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 10px;
}

.meta-card strong {
  font-size: 1.25rem;
  line-height: 1.2;
}

.layout {
  display: grid;
  gap: 24px;
}

.hero-panel {
  padding: 28px;
  display: grid;
  gap: 18px;
  background:
    linear-gradient(135deg, rgba(29, 92, 74, 0.96), rgba(15, 35, 33, 0.98)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent);
  color: #f9f4eb;
}

.hero-topline {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.hero-chip,
.filter-chip,
.signal-chip,
.source-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.86rem;
}

.signal-chip {
  border-color: rgba(21, 32, 31, 0.12);
  background: rgba(255, 255, 255, 0.75);
  color: var(--text);
}

.signal-chip.backfill {
  background: var(--amber-soft);
  color: #78511f;
}

.signal-chip.signal {
  background: var(--green-soft);
  color: var(--green);
}

.signal-chip.market-data {
  background: rgba(33, 98, 82, 0.12);
  color: var(--green);
}

.signal-chip.headline-fallback {
  background: rgba(159, 110, 47, 0.14);
  color: #7c5c2b;
}

.signal-chip.none {
  background: rgba(21, 32, 31, 0.08);
  color: var(--muted);
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.3rem);
  line-height: 1;
}

.hero-summary {
  margin: 0;
  max-width: 65ch;
  color: rgba(249, 244, 235, 0.82);
  line-height: 1.7;
}

.hero-grid,
.overview-grid,
.two-column {
  display: grid;
  gap: 24px;
}

.hero-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hero-stat {
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hero-stat span {
  display: block;
  color: rgba(249, 244, 235, 0.66);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 10px;
}

.hero-stat strong {
  font-size: 1.65rem;
}

.overview-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.overview-card,
.panel {
  padding: 24px;
}

.pill-row,
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.6);
}

.pill-count {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ink);
  color: #fff;
  font-size: 0.82rem;
}

.filter-chip {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--text);
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.filter-chip:hover,
.filter-chip.is-active {
  transform: translateY(-1px);
  background: var(--panel-strong);
  border-color: rgba(29, 92, 74, 0.28);
}

.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-head.compact {
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 0;
  font-size: 2rem;
}

.section-note {
  max-width: 48ch;
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.asset-card {
  padding: 24px;
  display: grid;
  gap: 18px;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.asset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 30px 60px rgba(31, 42, 42, 0.14);
}

.asset-top {
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: start;
}

.asset-title {
  margin: 0 0 6px;
  font-size: 1.7rem;
}

.asset-symbol-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.asset-symbol {
  padding: 7px 10px;
  border-radius: 999px;
  background: #eef4ef;
  border: 1px solid rgba(29, 92, 74, 0.14);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.asset-type {
  color: var(--muted);
  font-size: 0.86rem;
  text-transform: capitalize;
}

.asset-conviction {
  margin: 0;
  color: var(--muted);
}

.score-disc {
  position: relative;
  width: 92px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, var(--panel-strong) 0 56%, transparent 57%),
    conic-gradient(var(--disc-color) calc(var(--score) * 1%), rgba(21, 32, 31, 0.08) 0);
  box-shadow: inset 0 0 0 1px rgba(21, 32, 31, 0.05);
}

.score-disc::after {
  content: "";
  position: absolute;
  inset: 11px;
  border-radius: 50%;
  background: rgba(255, 250, 241, 0.96);
  z-index: 0;
}

.score-disc strong,
.score-disc span {
  position: relative;
  z-index: 1;
}

.score-disc strong {
  font-size: 1.4rem;
}

.score-disc span {
  display: block;
  font-size: 0.73rem;
  color: var(--muted);
}

.asset-copy {
  display: grid;
  gap: 12px;
}

.probability-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.probability-track {
  display: grid;
  grid-template-columns: var(--positive) var(--neutral) var(--negative);
  min-height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(21, 32, 31, 0.08);
}

.probability-segment.positive {
  background: linear-gradient(90deg, #3b8f71, #2b6b56);
}

.probability-segment.neutral {
  background: linear-gradient(90deg, #d8c18f, #c39856);
}

.probability-segment.negative {
  background: linear-gradient(90deg, #be715f, #9f4a39);
}

.probability-labels,
.breakdown-grid {
  display: grid;
  gap: 10px;
}

.probability-labels {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.probability-labels span,
.breakdown-item span,
.headline-source,
.source-meta,
.headline-rank {
  color: var(--muted);
}

.probability-labels strong,
.breakdown-item strong {
  display: block;
  margin-top: 2px;
}

.breakdown-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.breakdown-item {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
}

.headline-stack,
.source-list,
.headline-list {
  display: grid;
  gap: 12px;
}

.headline-item,
.source-row {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.58);
}

.headline-row {
  display: flex;
  align-items: start;
  gap: 12px;
}

.headline-rank {
  min-width: 2ch;
  font-size: 0.82rem;
  padding-top: 2px;
}

.headline-text {
  margin: 0;
  line-height: 1.55;
}

.headline-source {
  display: inline-block;
  margin-top: 6px;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.source-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.source-row strong {
  display: block;
  margin-bottom: 4px;
}

.source-count {
  min-width: 54px;
  text-align: right;
  font-size: 1.2rem;
}

.status-ok {
  color: var(--green);
}

.status-issue {
  color: var(--red);
}

.is-hidden {
  display: none;
}

@media (max-width: 980px) {
  .masthead,
  .overview-grid,
  .asset-grid,
  .two-column,
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    align-items: start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(100vw - 20px, 100%);
    padding: 18px 0 40px;
  }

  .masthead-copy,
  .masthead-meta,
  .hero-panel,
  .overview-card,
  .panel,
  .asset-card {
    border-radius: 20px;
  }

  .masthead-copy,
  .hero-panel,
  .overview-card,
  .panel,
  .asset-card {
    padding: 20px;
  }

  .asset-top {
    flex-direction: column;
  }

  .breakdown-grid,
  .probability-labels {
    grid-template-columns: 1fr;
  }
}`;
}

function buildAppScript(): string {
  return `const report = JSON.parse(document.getElementById('report-data').textContent || '{}');

const assetGrid = document.getElementById('asset-grid');
const heroPanel = document.getElementById('hero-panel');
const filters = document.getElementById('filters');
const sourceList = document.getElementById('source-list');
const headlineList = document.getElementById('headline-list');
const eventOverview = document.getElementById('event-overview');

const state = {
  filter: 'signal-only',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pct(value) {
  return (value * 100).toFixed(1) + '%';
}

function scoreColor(score) {
  if (score >= 75) return '#2f7b62';
  if (score >= 60) return '#876026';
  return '#9f4a39';
}

function formatAssetType(value) {
  return value.replaceAll('_', ' ');
}

function momentumSourceLabel(value) {
  if (value === 'market_data') return 'Market data';
  if (value === 'headline_fallback') return 'Headline fallback';
  return 'No momentum';
}

function eventTypeLabel(value) {
  return value.replaceAll('_', ' ');
}

function eventMixLabel(topEvents) {
  if (!topEvents || topEvents.length === 0) {
    return 'none';
  }

  return topEvents
    .map((event) => eventTypeLabel(event.eventType) + ' ' + event.direction + ' x' + event.count)
    .join(', ');
}

function percentPoints(value) {
  return value.toFixed(2) + '%';
}

function filteredRankings() {
  if (state.filter === 'all') return report.rankings;
  if (state.filter === 'signal-only') return report.rankings.filter((item) => item.rankingSource === 'signal');
  if (state.filter === 'backfill-only') return report.rankings.filter((item) => item.rankingSource === 'backfill');
  return report.rankings.filter((item) => item.type === state.filter);
}

function renderHero() {
  const top = report.rankings[0];
  if (!top) {
    heroPanel.innerHTML = '<p>No ranked assets available.</p>';
    return;
  }

  heroPanel.innerHTML = \`
    <div class="hero-topline">
      <span class="hero-chip">Lead idea</span>
      <span class="hero-chip">\${escapeHtml(top.type.replaceAll('_', ' '))}</span>
      <span class="hero-chip">\${escapeHtml(top.eventConfidence.label)} event bias</span>
    </div>
    <h2 class="hero-title">\${escapeHtml(top.symbol)} <span style="opacity:.72;">/</span> \${escapeHtml(top.label)}</h2>
    <p class="hero-summary">
      Highest current score at <strong>\${top.score}/100</strong>, driven mainly by a risk-adjusted market score of
      <strong>\${top.breakdown.momentum > 0 ? '+' : ''}\${top.breakdown.momentum.toFixed(2)}</strong> and a vol scale of
      <strong>\${top.breakdown.volatilityScale.toFixed(2)}x</strong>, with event flow acting as the secondary overlay.
    </p>
    <div class="hero-grid">
      <div class="hero-stat">
        <span>Conviction</span>
        <strong>\${escapeHtml(top.conviction)}</strong>
      </div>
      <div class="hero-stat">
        <span>Support count</span>
        <strong>\${top.signalCount} signals</strong>
      </div>
      <div class="hero-stat">
        <span>Event mix</span>
        <strong>\${eventMixLabel(top.eventConfidence.topEvents)}</strong>
      </div>
    </div>
  \`;
}

function renderOverview() {
  const totals = report.rankings.reduce(
    (acc, item) => {
      acc[item.eventConfidence.label] += 1;
      return acc;
    },
    { bullish: 0, neutral: 0, bearish: 0 },
  );

  eventOverview.innerHTML = [
    ['bullish', totals.bullish],
    ['neutral', totals.neutral],
    ['bearish', totals.bearish],
  ]
    .map(([label, count]) => \`<span class="pill"><span class="pill-count">\${count}</span><strong>\${escapeHtml(label)}</strong></span>\`)
    .join('');
}

function renderFilters() {
  const options = [
    ['signal-only', 'Live ideas'],
    ['all', 'All assets'],
    ['backfill-only', 'Backfills'],
    ['stock', 'Stocks'],
    ['index_fund', 'Index funds'],
  ];

  filters.innerHTML = options
    .map(
      ([value, label]) =>
        \`<button class="filter-chip \${state.filter === value ? 'is-active' : ''}" type="button" data-filter="\${escapeHtml(value)}">\${escapeHtml(label)}</button>\`,
    )
    .join('');

  filters.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.getAttribute('data-filter') || 'all';
      renderFilters();
      renderAssets();
    });
  });
}

function renderAssets() {
  assetGrid.innerHTML = filteredRankings()
    .map((item) => {
      const marketSign = item.breakdown.momentum > 0 ? '+' : '';
      const eventOverlaySign = item.breakdown.eventScore > 0 ? '+' : '';
      const trendSign = item.breakdown.rawMomentumPercent > 0 ? '+' : '';
      return \`
        <article class="asset-card">
          <div class="asset-top">
            <div class="asset-copy">
              <div class="asset-symbol-row">
                <span class="asset-symbol">\${item.symbol}</span>
                <span class="asset-type">\${escapeHtml(formatAssetType(item.type))}</span>
                <span class="signal-chip \${item.rankingSource}">\${item.rankingSource === 'signal' ? 'Signal-backed' : 'Backfill'}</span>
                <span class="signal-chip \${item.breakdown.momentumSource.replaceAll('_', '-')}">\${escapeHtml(momentumSourceLabel(item.breakdown.momentumSource))}</span>
              </div>
              <div>
                <h3 class="asset-title">\${escapeHtml(item.label)}</h3>
                <p class="asset-conviction">\${escapeHtml(item.conviction)}</p>
              </div>
            </div>
            <div class="score-disc" style="--score: \${item.score}; --disc-color: \${scoreColor(item.score)};">
              <div>
                <strong>\${item.score}</strong>
                <span>score</span>
              </div>
            </div>
          </div>

          <div class="probability-bar">
            <div class="probability-track" style="--positive: \${Math.max(item.eventConfidence.probabilities.bullish * 100, 6)}%; --neutral: \${Math.max(item.eventConfidence.probabilities.neutral * 100, 6)}%; --negative: \${Math.max(item.eventConfidence.probabilities.bearish * 100, 6)}%;">
              <span class="probability-segment positive"></span>
              <span class="probability-segment neutral"></span>
              <span class="probability-segment negative"></span>
            </div>
            <div class="probability-labels">
              <div><span>Bullish</span><strong>\${pct(item.eventConfidence.probabilities.bullish)}</strong></div>
              <div><span>Neutral</span><strong>\${pct(item.eventConfidence.probabilities.neutral)}</strong></div>
              <div><span>Bearish</span><strong>\${pct(item.eventConfidence.probabilities.bearish)}</strong></div>
            </div>
          </div>

          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span>Market score</span>
              <strong>\${marketSign}\${item.breakdown.momentum.toFixed(2)}</strong>
            </div>
            <div class="breakdown-item">
              <span>Raw trend</span>
              <strong>\${trendSign}\${item.breakdown.rawMomentumPercent.toFixed(2)}%</strong>
            </div>
            <div class="breakdown-item">
              <span>Vol scale</span>
              <strong>\${item.breakdown.volatilityScale.toFixed(2)}x</strong>
            </div>
            <div class="breakdown-item">
              <span>Event overlay</span>
              <strong>\${eventOverlaySign}\${item.breakdown.eventScore}</strong>
            </div>
            <div class="breakdown-item">
              <span>Event call</span>
              <strong>\${escapeHtml(item.eventConfidence.label)} at \${pct(item.eventConfidence.confidence)}</strong>
            </div>
            <div class="breakdown-item">
              <span>Event mix</span>
              <strong>\${escapeHtml(eventMixLabel(item.eventConfidence.topEvents))}</strong>
            </div>
            <div class="breakdown-item">
              <span>Event confidence</span>
              <strong>\${item.breakdown.eventConfidenceWeight.toFixed(3)}</strong>
            </div>
            <div class="breakdown-item">
              <span>Macro</span>
              <strong>\${item.breakdown.macro > 0 ? '+' : ''}\${item.breakdown.macro}</strong>
            </div>
            <div class="breakdown-item">
              <span>Credibility</span>
              <strong>\${item.breakdown.credibility > 0 ? '+' : ''}\${item.breakdown.credibility}</strong>
            </div>
          </div>

          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span>Last price</span>
              <strong>\${item.marketData && item.marketData.quote ? item.marketData.quote.lastPrice.toFixed(2) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>1D move</span>
              <strong>\${item.marketData && item.marketData.quote && item.marketData.quote.changePercent !== undefined ? (item.marketData.quote.changePercent > 0 ? '+' : '') + item.marketData.quote.changePercent.toFixed(2) + '%' : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>5D move</span>
              <strong>\${item.marketData && item.marketData.momentum ? (item.marketData.momentum.fiveDayPercent > 0 ? '+' : '') + item.marketData.momentum.fiveDayPercent.toFixed(2) + '%' : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>5D vol</span>
              <strong>\${item.realizedVolatility ? percentPoints(item.realizedVolatility.fiveDay) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>20D vol</span>
              <strong>\${item.realizedVolatility ? percentPoints(item.realizedVolatility.twentyDay) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>Benchmark</span>
              <strong>\${item.benchmarkComparison ? escapeHtml(item.benchmarkComparison.benchmarkSymbol) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>Rel 5D</span>
              <strong>\${item.benchmarkComparison ? (item.benchmarkComparison.relativeReturn5d > 0 ? '+' : '') + percentPoints(item.benchmarkComparison.relativeReturn5d) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>Rel 20D</span>
              <strong>\${item.benchmarkComparison ? (item.benchmarkComparison.relativeReturn20d > 0 ? '+' : '') + percentPoints(item.benchmarkComparison.relativeReturn20d) : 'n/a'}</strong>
            </div>
          </div>

          <div class="headline-stack">
            \${item.supportingHeadlines
              .map(
                (headline, index) => \`
                  <div class="headline-item">
                    <div class="headline-row">
                      <span class="headline-rank">0\${index + 1}</span>
                      <div>
                        <p class="headline-text">\${escapeHtml(headline.headline)}</p>
                        <span class="headline-source">\${escapeHtml(headline.source)}</span>
                      </div>
                    </div>
                  </div>
                \`,
              )
              .join('')}
          </div>
        </article>
      \`;
    })
    .join('');
}

function renderSources() {
  sourceList.innerHTML = report.sources
    .map((source) => \`
      <div class="source-row">
        <div>
          <strong>\${escapeHtml(source.name)}</strong>
          <div class="source-meta \${source.error ? 'status-issue' : 'status-ok'}">\${escapeHtml(source.error ? source.error : 'Tracking cleanly')}</div>
        </div>
        <div class="source-count">\${source.headlineCount}</div>
      </div>
    \`)
    .join('');
}

function renderHeadlines() {
  headlineList.innerHTML = report.headlineSample
    .slice(0, 16)
    .map((headline, index) => \`
      <div class="headline-item">
        <div class="headline-row">
          <span class="headline-rank">\${String(index + 1).padStart(2, '0')}</span>
          <p class="headline-text">\${escapeHtml(headline)}</p>
        </div>
      </div>
    \`)
    .join('');
}

function renderMeta() {
  document.getElementById('published-at').textContent = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(new Date(report.generatedAt));
  document.getElementById('asset-count').textContent = String(report.rankings.length);
  document.getElementById('source-count').textContent = String(report.sources.length);
}

renderMeta();
renderHero();
renderOverview();
renderFilters();
renderAssets();
renderSources();
renderHeadlines();`;
}

export function buildSiteAssets(report: DailyReport): SiteAssets {
  return {
    html: buildHtmlShell(report),
    css: buildStyles(),
    js: buildAppScript(),
  };
}
