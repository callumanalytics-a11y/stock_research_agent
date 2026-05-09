import assert from 'node:assert/strict';
import test from 'node:test';
import { predictSentimentFromHits, summarizeSentimentConfidence } from '../src/lib/sentiment.ts';

test('predictSentimentFromHits returns softmax-style probabilities', () => {
  const sentiment = predictSentimentFromHits(2, 0);
  const total =
    sentiment.probabilities.positive +
    sentiment.probabilities.neutral +
    sentiment.probabilities.negative;

  assert.equal(sentiment.label, 'positive');
  assert.ok(sentiment.confidence > 0.5);
  assert.ok(Math.abs(total - 1) < 0.000001);
});

test('summarizeSentimentConfidence aggregates headline sentiment probabilities', () => {
  const summary = summarizeSentimentConfidence([
    predictSentimentFromHits(2, 0),
    predictSentimentFromHits(1, 0),
    predictSentimentFromHits(0, 1),
  ]);

  assert.equal(summary.label, 'positive');
  assert.ok(summary.confidence > summary.probabilities.negative);
  assert.equal(summary.sampleSize, 3);
});
