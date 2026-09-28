import { describe, expect, it } from 'vitest';
import { dailyUsageDocId, todayDateKey } from '@/lib/usage/dateKey';

describe('todayDateKey', () => {
  it('formats a UTC date as yyyy-mm-dd', () => {
    expect(todayDateKey(new Date('2026-09-28T14:30:00Z'))).toBe('2026-09-28');
  });

  it('uses the UTC day, not local — a time just after UTC midnight stays on the new UTC day', () => {
    expect(todayDateKey(new Date('2026-09-28T00:05:00Z'))).toBe('2026-09-28');
  });

  it('uses the UTC day for a time just before UTC midnight too', () => {
    expect(todayDateKey(new Date('2026-09-28T23:55:00Z'))).toBe('2026-09-28');
  });
});

describe('dailyUsageDocId', () => {
  it('joins userId and date with an underscore', () => {
    expect(dailyUsageDocId('user-1', '2026-09-28')).toBe('user-1_2026-09-28');
  });
});
