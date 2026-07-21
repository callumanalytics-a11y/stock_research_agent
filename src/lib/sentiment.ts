import type {
  HeadlineSentiment,
  SentimentConfidenceSummary,
  SentimentLabel,
  SentimentLogits,
  SentimentProbabilities,
} from '../types/models.ts';

function softmax(values: number[]): number[] {
  const maxValue = Math.max(...values);
  const exps = values.map((value) => Math.exp(value - maxValue));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

function probabilitiesFromLogits(logits: SentimentLogits): SentimentProbabilities {
  const [positive, neutral, negative] = softmax([logits.positive, logits.neutral, logits.negative]);

  return {
    positive,
    neutral,
    negative,
  };
}

function labelFromProbabilities(probabilities: SentimentProbabilities): SentimentLabel {
  const directionalTop = Math.max(probabilities.positive, probabilities.negative);
  const directionalGap = Math.abs(probabilities.positive - probabilities.negative);
  const neutralLead = probabilities.neutral - directionalTop;

  if (neutralLead > 0.015 && directionalGap < 0.08) {
    return 'neutral';
  }

  return probabilities.positive >= probabilities.negative ? 'positive' : 'negative';
}

function confidenceForLabel(label: SentimentLabel, probabilities: SentimentProbabilities): number {
  return probabilities[label];
}

export function predictSentimentFromHits(positiveHits: number, negativeHits: number): HeadlineSentiment {
  const netSentiment = positiveHits - negativeHits;
  const logits: SentimentLogits = {
    positive: positiveHits * 1.6 - negativeHits * 0.85,
    neutral: 1 - Math.abs(netSentiment) * 0.5 - (positiveHits + negativeHits) * 0.1,
    negative: negativeHits * 1.6 - positiveHits * 0.85,
  };
  const probabilities = probabilitiesFromLogits(logits);
  const label = labelFromProbabilities(probabilities);

  return {
    positiveHits,
    negativeHits,
    netSentiment,
    logits,
    probabilities,
    label,
    confidence: confidenceForLabel(label, probabilities),
  };
}

export function summarizeSentimentConfidence(sentiments: HeadlineSentiment[]): SentimentConfidenceSummary {
  if (sentiments.length === 0) {
    return {
      label: 'neutral',
      confidence: 1 / 3,
      probabilities: {
        positive: 1 / 3,
        neutral: 1 / 3,
        negative: 1 / 3,
      },
      sampleSize: 0,
    };
  }

  const aggregateLogits = sentiments.reduce<SentimentLogits>(
    (total, sentiment) => ({
      positive: total.positive + sentiment.logits.positive,
      neutral: total.neutral + sentiment.logits.neutral,
      negative: total.negative + sentiment.logits.negative,
    }),
    { positive: 0, neutral: 0, negative: 0 },
  );
  const averageLogits: SentimentLogits = {
    positive: aggregateLogits.positive / sentiments.length,
    neutral: aggregateLogits.neutral / sentiments.length,
    negative: aggregateLogits.negative / sentiments.length,
  };
  const probabilities = probabilitiesFromLogits(averageLogits);
  const label = labelFromProbabilities(probabilities);

  return {
    label,
    confidence: confidenceForLabel(label, probabilities),
    probabilities,
    sampleSize: sentiments.length,
  };
}
