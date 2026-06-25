import assert from 'node:assert/strict';
import test from 'node:test';
import { extractFinanceEvents, summarizeFinanceEvents } from '../src/lib/finance-events.ts';

test('extractFinanceEvents classifies finance headlines into event types', () => {
  const events = extractFinanceEvents('Company beats estimates and raises guidance after analyst upgrade');

  assert.ok(events.some((event) => event.eventType === 'earnings' && event.direction === 'bullish'));
  assert.ok(events.some((event) => event.eventType === 'guidance' && event.direction === 'bullish'));
  assert.ok(events.some((event) => event.eventType === 'analyst_rating' && event.direction === 'bullish'));
});

test('extractFinanceEvents catches regulation and litigation risk', () => {
  const events = extractFinanceEvents('Group faces probe, lawsuit and downgrade after regulator scrutiny');

  assert.ok(events.some((event) => event.eventType === 'regulation' && event.direction === 'bearish'));
  assert.ok(events.some((event) => event.eventType === 'litigation' && event.direction === 'bearish'));
  assert.ok(events.some((event) => event.eventType === 'analyst_rating' && event.direction === 'bearish'));
});

test('summarizeFinanceEvents aggregates bullish and bearish event probability', () => {
  const summary = summarizeFinanceEvents([
    {
      eventType: 'earnings',
      direction: 'bullish',
      confidence: 0.9,
      strength: 1.2,
      phrase: 'beats estimates',
    },
    {
      eventType: 'guidance',
      direction: 'bearish',
      confidence: 0.95,
      strength: 1.4,
      phrase: 'cuts guidance',
    },
    {
      eventType: 'analyst_rating',
      direction: 'bullish',
      confidence: 0.8,
      strength: 0.8,
      phrase: 'upgrade',
    },
  ]);

  assert.equal(summary.sampleSize, 3);
  assert.ok(summary.confidence > 0.33);
  assert.ok(summary.topEvents.length > 0);
  assert.ok(['bullish', 'bearish', 'neutral'].includes(summary.label));
});
