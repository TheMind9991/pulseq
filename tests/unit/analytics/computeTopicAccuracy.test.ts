import { describe, expect, it } from 'vitest';
import {
  aggregateTopicStats,
  computeAccuracy,
  computeTopicStatus,
} from '@/lib/analytics/computeTopicAccuracy';

describe('computeAccuracy', () => {
  it('returns 0 when nothing has been seen', () => {
    expect(computeAccuracy(0, 0)).toBe(0);
  });

  it('divides correct by seen', () => {
    expect(computeAccuracy(3, 4)).toBe(0.75);
  });

  it('never divides by zero even with a positive correct count', () => {
    expect(computeAccuracy(5, 0)).toBe(0);
  });
});

describe('computeTopicStatus', () => {
  it('classifies >=75% as strong', () => {
    expect(computeTopicStatus(0.75)).toBe('strong');
    expect(computeTopicStatus(1)).toBe('strong');
  });

  it('classifies 50-74% as watch', () => {
    expect(computeTopicStatus(0.5)).toBe('watch');
    expect(computeTopicStatus(0.74)).toBe('watch');
  });

  it('classifies <50% as weak', () => {
    expect(computeTopicStatus(0.49)).toBe('weak');
    expect(computeTopicStatus(0)).toBe('weak');
  });
});

describe('aggregateTopicStats', () => {
  it('counts only questions with at least one attempt', () => {
    const result = aggregateTopicStats([
      { timesSeen: 2, timesCorrect: 1 },
      { timesSeen: 0, timesCorrect: 0 }, // never actually answered — shouldn't happen in
      // practice (docs are only created on first answer) but the aggregator should still be
      // defensive about it
      { timesSeen: 1, timesCorrect: 1 },
    ]);
    expect(result.questionsAnswered).toBe(2);
  });

  it('computes accuracy across all attempts, not just distinct questions', () => {
    const result = aggregateTopicStats([
      { timesSeen: 2, timesCorrect: 2 },
      { timesSeen: 2, timesCorrect: 0 },
    ]);
    expect(result.accuracy).toBe(0.5);
    expect(result.status).toBe('watch');
  });

  it('returns weak/0 for an empty topic', () => {
    const result = aggregateTopicStats([]);
    expect(result).toEqual({ questionsAnswered: 0, accuracy: 0, status: 'weak' });
  });
});
