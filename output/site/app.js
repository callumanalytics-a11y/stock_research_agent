const report = JSON.parse(document.getElementById('report-data').textContent || '{}');

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

  heroPanel.innerHTML = `
    <div class="hero-topline">
      <span class="hero-chip">Lead idea</span>
      <span class="hero-chip">${escapeHtml(top.type.replaceAll('_', ' '))}</span>
      <span class="hero-chip">${escapeHtml(top.eventConfidence.label)} event bias</span>
    </div>
    <h2 class="hero-title">${escapeHtml(top.symbol)} <span style="opacity:.72;">/</span> ${escapeHtml(top.label)}</h2>
    <p class="hero-summary">
      Highest current score at <strong>${top.score}/100</strong>, driven mainly by a risk-adjusted market score of
      <strong>${top.breakdown.momentum > 0 ? '+' : ''}${top.breakdown.momentum.toFixed(2)}</strong> and a vol scale of
      <strong>${top.breakdown.volatilityScale.toFixed(2)}x</strong>, with event flow acting as the secondary overlay.
    </p>
    <div class="hero-grid">
      <div class="hero-stat">
        <span>Conviction</span>
        <strong>${escapeHtml(top.conviction)}</strong>
      </div>
      <div class="hero-stat">
        <span>Support count</span>
        <strong>${top.signalCount} signals</strong>
      </div>
      <div class="hero-stat">
        <span>Event mix</span>
        <strong>${eventMixLabel(top.eventConfidence.topEvents)}</strong>
      </div>
    </div>
  `;
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
    .map(([label, count]) => `<span class="pill"><span class="pill-count">${count}</span><strong>${escapeHtml(label)}</strong></span>`)
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
        `<button class="filter-chip ${state.filter === value ? 'is-active' : ''}" type="button" data-filter="${escapeHtml(value)}">${escapeHtml(label)}</button>`,
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
      return `
        <article class="asset-card">
          <div class="asset-top">
            <div class="asset-copy">
              <div class="asset-symbol-row">
                <span class="asset-symbol">${item.symbol}</span>
                <span class="asset-type">${escapeHtml(formatAssetType(item.type))}</span>
                <span class="signal-chip ${item.rankingSource}">${item.rankingSource === 'signal' ? 'Signal-backed' : 'Backfill'}</span>
                <span class="signal-chip ${item.breakdown.momentumSource.replaceAll('_', '-')}">${escapeHtml(momentumSourceLabel(item.breakdown.momentumSource))}</span>
              </div>
              <div>
                <h3 class="asset-title">${escapeHtml(item.label)}</h3>
                <p class="asset-conviction">${escapeHtml(item.conviction)}</p>
              </div>
            </div>
            <div class="score-disc" style="--score: ${item.score}; --disc-color: ${scoreColor(item.score)};">
              <div>
                <strong>${item.score}</strong>
                <span>score</span>
              </div>
            </div>
          </div>

          <div class="probability-bar">
            <div class="probability-track" style="--positive: ${Math.max(item.eventConfidence.probabilities.bullish * 100, 6)}%; --neutral: ${Math.max(item.eventConfidence.probabilities.neutral * 100, 6)}%; --negative: ${Math.max(item.eventConfidence.probabilities.bearish * 100, 6)}%;">
              <span class="probability-segment positive"></span>
              <span class="probability-segment neutral"></span>
              <span class="probability-segment negative"></span>
            </div>
            <div class="probability-labels">
              <div><span>Bullish</span><strong>${pct(item.eventConfidence.probabilities.bullish)}</strong></div>
              <div><span>Neutral</span><strong>${pct(item.eventConfidence.probabilities.neutral)}</strong></div>
              <div><span>Bearish</span><strong>${pct(item.eventConfidence.probabilities.bearish)}</strong></div>
            </div>
          </div>

          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span>Market score</span>
              <strong>${marketSign}${item.breakdown.momentum.toFixed(2)}</strong>
            </div>
            <div class="breakdown-item">
              <span>Raw trend</span>
              <strong>${trendSign}${item.breakdown.rawMomentumPercent.toFixed(2)}%</strong>
            </div>
            <div class="breakdown-item">
              <span>Vol scale</span>
              <strong>${item.breakdown.volatilityScale.toFixed(2)}x</strong>
            </div>
            <div class="breakdown-item">
              <span>Event overlay</span>
              <strong>${eventOverlaySign}${item.breakdown.eventScore}</strong>
            </div>
            <div class="breakdown-item">
              <span>Event call</span>
              <strong>${escapeHtml(item.eventConfidence.label)} at ${pct(item.eventConfidence.confidence)}</strong>
            </div>
            <div class="breakdown-item">
              <span>Event mix</span>
              <strong>${escapeHtml(eventMixLabel(item.eventConfidence.topEvents))}</strong>
            </div>
            <div class="breakdown-item">
              <span>Event confidence</span>
              <strong>${item.breakdown.eventConfidenceWeight.toFixed(3)}</strong>
            </div>
            <div class="breakdown-item">
              <span>Macro</span>
              <strong>${item.breakdown.macro > 0 ? '+' : ''}${item.breakdown.macro}</strong>
            </div>
            <div class="breakdown-item">
              <span>Credibility</span>
              <strong>${item.breakdown.credibility > 0 ? '+' : ''}${item.breakdown.credibility}</strong>
            </div>
          </div>

          <div class="breakdown-grid">
            <div class="breakdown-item">
              <span>Last price</span>
              <strong>${item.marketData && item.marketData.quote ? item.marketData.quote.lastPrice.toFixed(2) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>1D move</span>
              <strong>${item.marketData && item.marketData.quote && item.marketData.quote.changePercent !== undefined ? (item.marketData.quote.changePercent > 0 ? '+' : '') + item.marketData.quote.changePercent.toFixed(2) + '%' : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>5D move</span>
              <strong>${item.marketData && item.marketData.momentum ? (item.marketData.momentum.fiveDayPercent > 0 ? '+' : '') + item.marketData.momentum.fiveDayPercent.toFixed(2) + '%' : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>5D vol</span>
              <strong>${item.realizedVolatility ? percentPoints(item.realizedVolatility.fiveDay) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>20D vol</span>
              <strong>${item.realizedVolatility ? percentPoints(item.realizedVolatility.twentyDay) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>Benchmark</span>
              <strong>${item.benchmarkComparison ? escapeHtml(item.benchmarkComparison.benchmarkSymbol) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>Rel 5D</span>
              <strong>${item.benchmarkComparison ? (item.benchmarkComparison.relativeReturn5d > 0 ? '+' : '') + percentPoints(item.benchmarkComparison.relativeReturn5d) : 'n/a'}</strong>
            </div>
            <div class="breakdown-item">
              <span>Rel 20D</span>
              <strong>${item.benchmarkComparison ? (item.benchmarkComparison.relativeReturn20d > 0 ? '+' : '') + percentPoints(item.benchmarkComparison.relativeReturn20d) : 'n/a'}</strong>
            </div>
          </div>

          <div class="headline-stack">
            ${item.supportingHeadlines
              .map(
                (headline, index) => `
                  <div class="headline-item">
                    <div class="headline-row">
                      <span class="headline-rank">0${index + 1}</span>
                      <div>
                        <p class="headline-text">${escapeHtml(headline.headline)}</p>
                        <span class="headline-source">${escapeHtml(headline.source)}</span>
                      </div>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        </article>
      `;
    })
    .join('');
}

function renderSources() {
  sourceList.innerHTML = report.sources
    .map((source) => `
      <div class="source-row">
        <div>
          <strong>${escapeHtml(source.name)}</strong>
          <div class="source-meta ${source.error ? 'status-issue' : 'status-ok'}">${escapeHtml(source.error ? source.error : 'Tracking cleanly')}</div>
        </div>
        <div class="source-count">${source.headlineCount}</div>
      </div>
    `)
    .join('');
}

function renderHeadlines() {
  headlineList.innerHTML = report.headlineSample
    .slice(0, 16)
    .map((headline, index) => `
      <div class="headline-item">
        <div class="headline-row">
          <span class="headline-rank">${String(index + 1).padStart(2, '0')}</span>
          <p class="headline-text">${escapeHtml(headline)}</p>
        </div>
      </div>
    `)
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
renderHeadlines();