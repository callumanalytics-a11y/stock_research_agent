export type AssetType = 'stock' | 'index_fund';

export interface PublicationSource {
  id: string;
  name: string;
  url: string;
  credibilityWeight: number;
  selectors: string[];
}

export interface WatchlistAsset {
  symbol: string;
  type: AssetType;
  label: string;
  aliases: string[];
}

export interface PerformanceSignal {
  percentChange: number;
  phrase: string;
}

export type FinanceEventType =
  | 'earnings'
  | 'guidance'
  | 'analyst_rating'
  | 'regulation'
  | 'litigation'
  | 'capital_return'
  | 'm_and_a'
  | 'product'
  | 'macro'
  | 'other';

export type FinanceEventDirection = 'bullish' | 'neutral' | 'bearish';

export interface FinanceEventSignal {
  eventType: FinanceEventType;
  direction: FinanceEventDirection;
  confidence: number;
  strength: number;
  phrase: string;
  sourceWeight?: number;
}

export interface FinanceEventProbabilities {
  bullish: number;
  neutral: number;
  bearish: number;
}

export interface FinanceEventMix {
  eventType: FinanceEventType;
  count: number;
  direction: FinanceEventDirection;
}

export interface FinanceEventSummary {
  label: FinanceEventDirection;
  confidence: number;
  probabilities: FinanceEventProbabilities;
  sampleSize: number;
  topEventType: FinanceEventType | 'none';
  topEvents: FinanceEventMix[];
}

export type MarketDataProvider = 'alpaca' | 'yfinance' | 'none';

export interface MarketQuote {
  symbol: string;
  lastPrice: number;
  previousClose?: number;
  changePercent?: number;
  asOf: string;
  provider: MarketDataProvider;
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

export interface RealizedVolatility {
  fiveDay: number;
  twentyDay: number;
  annualizedTwentyDay: number;
}

export interface BenchmarkComparison {
  benchmarkSymbol: string;
  assetFiveDayReturn: number;
  assetTwentyDayReturn: number;
  benchmarkFiveDayReturn: number;
  benchmarkTwentyDayReturn: number;
  relativeReturn5d: number;
  relativeReturn20d: number;
}

export interface MarketDataSnapshot {
  symbol: string;
  provider: MarketDataProvider;
  quote: MarketQuote | null;
  bars: MarketBar[];
  momentum: MarketMomentum | null;
  error: string | null;
}

export type MomentumSource = 'market_data' | 'headline_fallback' | 'none';

export interface SentimentLogits {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentProbabilities {
  positive: number;
  neutral: number;
  negative: number;
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface HeadlineSentiment {
  positiveHits: number;
  negativeHits: number;
  netSentiment: number;
  logits: SentimentLogits;
  probabilities: SentimentProbabilities;
  label: SentimentLabel;
  confidence: number;
}

export interface ScrapedHeadline {
  headline: string;
  performance: PerformanceSignal | null;
  events: FinanceEventSignal[];
  macro: number;
}

export interface ScrapedSourceResult {
  sourceId: string;
  sourceName: string;
  url: string;
  credibilityWeight: number;
  headlines: ScrapedHeadline[];
  headlineCount: number;
  error?: string;
}

export interface SupportingHeadline {
  source: string;
  headline: string;
}

export interface AssetSignals {
  performanceSignals: PerformanceSignal[];
  eventSignals: FinanceEventSignal[];
  macroSignals: number[];
  sourceWeights: number[];
  matchedHeadlines: SupportingHeadline[];
  marketData: MarketDataSnapshot | null;
  realizedVolatility: RealizedVolatility | null;
  benchmarkComparison: BenchmarkComparison | null;
}

export interface ScoreBreakdown {
  base: number;
  momentum: number;
  rawMomentumPercent: number;
  momentumSource: MomentumSource;
  volatilityScale: number;
  benchmarkRelative: number;
  volatilityPenalty: number;
  eventScore: number;
  eventConfidenceWeight: number;
  macro: number;
  credibility: number;
  riskPenalty: number;
}

export type ConvictionLabel =
  | 'high-priority research'
  | 'positive watchlist'
  | 'mixed / monitor'
  | 'low conviction';

export interface SentimentConfidenceSummary {
  label: SentimentLabel;
  confidence: number;
  probabilities: SentimentProbabilities;
  sampleSize: number;
}

export interface ScoredAsset {
  symbol: string;
  label: string;
  type: AssetType;
  score: number;
  conviction: ConvictionLabel;
  marketData: MarketDataSnapshot | null;
  realizedVolatility: RealizedVolatility | null;
  benchmarkComparison: BenchmarkComparison | null;
  eventConfidence: FinanceEventSummary;
  breakdown: ScoreBreakdown;
}

export interface RankedAsset extends ScoredAsset {
  supportingHeadlines: SupportingHeadline[];
  signalCount: number;
  rankingSource: 'signal' | 'backfill';
}

export interface ReportSourceSummary {
  id: string;
  name: string;
  url: string;
  headlineCount: number;
  error: string | null;
}

export interface DailyReport {
  generatedAt: string;
  rankings: RankedAsset[];
  sources: ReportSourceSummary[];
  headlineSample: string[];
}

export interface SiteAssets {
  html: string;
  css: string;
  js: string;
}
