import { describe, expect, it } from 'vitest';
import { buildMerchantOrderId, parseUserIdFromMerchantOrderId } from '@/lib/payments/merchantOrderId';

describe('buildMerchantOrderId / parseUserIdFromMerchantOrderId', () => {
  it('round-trips a plain uid', () => {
    const merchantOrderId = buildMerchantOrderId('user-abc123', 1700000000000);
    expect(parseUserIdFromMerchantOrderId(merchantOrderId)).toBe('user-abc123');
  });

  it('round-trips a uid that itself contains underscores', () => {
    const merchantOrderId = buildMerchantOrderId('weird_uid_with_underscores', 1700000000000);
    expect(parseUserIdFromMerchantOrderId(merchantOrderId)).toBe('weird_uid_with_underscores');
  });

  it('returns null for a string missing the pulseq_ prefix', () => {
    expect(parseUserIdFromMerchantOrderId('not-ours_123')).toBeNull();
  });

  it('returns null for a malformed value with no timestamp suffix', () => {
    expect(parseUserIdFromMerchantOrderId('pulseq_justauid')).toBeNull();
  });
});
