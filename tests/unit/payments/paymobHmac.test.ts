import { describe, expect, it } from 'vitest';
import { computePaymobHmac, verifyPaymobHmac, type PaymobTransactionCallback } from '@/lib/payments/paymobHmac';

// No verified Paymob test vector is available offline (see DECISIONS.md), so this exercises the
// round-trip property (a signature computed with the right secret verifies; any tamper fails)
// rather than asserting a specific hard-coded digest.
function baseCallback(overrides: Partial<PaymobTransactionCallback> = {}): PaymobTransactionCallback {
  return {
    amount_cents: 15000,
    created_at: '2026-09-28T12:00:00.000000',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    id: 123456,
    integration_id: 987,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 654321, merchant_order_id: 'pulseq_user-1_1700000000000' },
    owner: 42,
    pending: false,
    source_data: { pan: '2081', sub_type: 'MasterCard', type: 'card' },
    success: true,
    ...overrides,
  };
}

const SECRET = 'test-hmac-secret';

describe('computePaymobHmac / verifyPaymobHmac', () => {
  it('is deterministic for the same payload and secret', () => {
    const obj = baseCallback();
    expect(computePaymobHmac(obj, SECRET)).toBe(computePaymobHmac(obj, SECRET));
  });

  it('verifies a signature computed with the matching secret', () => {
    const obj = baseCallback();
    const hmac = computePaymobHmac(obj, SECRET);
    expect(verifyPaymobHmac(obj, SECRET, hmac)).toBe(true);
  });

  it('is case-insensitive when comparing the provided hmac', () => {
    const obj = baseCallback();
    const hmac = computePaymobHmac(obj, SECRET);
    expect(verifyPaymobHmac(obj, SECRET, hmac.toUpperCase())).toBe(true);
  });

  it('rejects a signature computed with the wrong secret', () => {
    const obj = baseCallback();
    const hmac = computePaymobHmac(obj, 'a-different-secret');
    expect(verifyPaymobHmac(obj, SECRET, hmac)).toBe(false);
  });

  it('rejects if any single field in the payload is tampered with after signing', () => {
    const obj = baseCallback();
    const hmac = computePaymobHmac(obj, SECRET);
    const tampered = { ...obj, amount_cents: 1 }; // e.g. an attacker downgrading the charged amount
    expect(verifyPaymobHmac(tampered, SECRET, hmac)).toBe(false);
  });

  it('rejects if the success flag is flipped after signing (the actual attack this guards against)', () => {
    const obj = baseCallback({ success: false });
    const hmac = computePaymobHmac(obj, SECRET);
    const tampered = { ...obj, success: true };
    expect(verifyPaymobHmac(tampered, SECRET, hmac)).toBe(false);
  });
});
