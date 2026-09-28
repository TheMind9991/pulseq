import { describe, expect, it } from 'vitest';
import { computeRemainingSeconds, formatCountdown } from '@/lib/sessions/examTiming';

describe('computeRemainingSeconds', () => {
  it('counts down from the full duration at t=0', () => {
    expect(computeRemainingSeconds(1000, 1800, 1000)).toBe(1800);
  });

  it('decreases as elapsed time increases', () => {
    expect(computeRemainingSeconds(1000, 1800, 1000 + 600_000)).toBe(1200);
  });

  it('never goes below 0, even long after expiry', () => {
    expect(computeRemainingSeconds(1000, 1800, 1000 + 999_000_000)).toBe(0);
  });

  it('is exactly 0 at the instant the duration elapses', () => {
    expect(computeRemainingSeconds(0, 60, 60_000)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats minutes and seconds, zero-padded', () => {
    expect(formatCountdown(65)).toBe('1:05');
    expect(formatCountdown(3599)).toBe('59:59');
  });

  it('formats 0 as 0:00', () => {
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('formats exactly one minute as 1:00', () => {
    expect(formatCountdown(60)).toBe('1:00');
  });
});
