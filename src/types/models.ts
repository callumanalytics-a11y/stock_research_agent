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
  sentiment: HeadlineSentiment;
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
  sentimentSignals: HeadlineSentiment[];
  macroSignals: number[];
  sourceWeights: number[];
  matchedHeadlines: SupportingHeadline[];
}

export interface ScoreBreakdown {
  base: number;
  momentum: number;
  sentiment: number;
  sentimentConfidenceWeight: number;
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
  sentimentConfidence: SentimentConfidenceSummary;
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
