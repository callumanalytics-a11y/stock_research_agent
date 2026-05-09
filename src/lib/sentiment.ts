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
  if (probabilities.positive >= probabilities.neutral && probabilities.positive >= probabilities.negative) {
    return 'positive';
  }

  if (probabilities.negative >= probabilities.neutral) {
    return 'negative';
  }

  return 'neutral';
}

function confidenceForLabel(label: SentimentLabel, probabilities: SentimentProbabilities): number {
  return probabilities[label];
}

export function predictSentimentFromHits(positiveHits: number, negativeHits: number): HeadlineSentiment {
  const netSentiment = positiveHits - negativeHits;
  const logits: SentimentLogits = {
    positive: positiveHits * 1.6 - negativeHits * 1.2,
    neutral: 0.8 - Math.abs(netSentiment) * 0.7 - (positiveHits + negativeHits) * 0.15,
    negative: negativeHits * 1.6 - positiveHits * 1.2,
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
