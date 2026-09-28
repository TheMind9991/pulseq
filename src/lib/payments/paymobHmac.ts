import { createHmac } from 'node:crypto';

// Paymob's "Transaction Processed Callback" HMAC (Section 7.4) is computed over this exact,
// documented field order from the callback's `obj` payload, concatenated with no separator, then
// HMAC-SHA512'd with the merchant's dashboard-issued secret. No 'server-only' guard — this is a
// pure function (no Firebase Admin dependency) so it can be unit-tested directly; it's only ever
// imported from the webhook route handler in practice.
//
// IMPORTANT: this field list is Paymob's long-standing public convention (used by every
// community integration library), not something verified against a live sandbox in this build —
// see DECISIONS.md. Confirm it against Paymob's current dashboard docs before relying on it in
// production.
const HMAC_FIELD_ORDER = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

export interface PaymobTransactionCallback {
  amount_cents: number;
  created_at: string;
  currency: string;
  error_occured: boolean;
  has_parent_transaction: boolean;
  id: number;
  integration_id: number;
  is_3d_secure: boolean;
  is_auth: boolean;
  is_capture: boolean;
  is_refunded: boolean;
  is_standalone_payment: boolean;
  is_voided: boolean;
  order: { id: number; merchant_order_id?: string };
  owner: number;
  pending: boolean;
  source_data: { pan: string; sub_type: string; type: string };
  success: boolean;
}

function fieldValue(obj: PaymobTransactionCallback, path: (typeof HMAC_FIELD_ORDER)[number]): string {
  const value = path === 'order.id'
    ? obj.order.id
    : path === 'source_data.pan'
      ? obj.source_data.pan
      : path === 'source_data.sub_type'
        ? obj.source_data.sub_type
        : path === 'source_data.type'
          ? obj.source_data.type
          : obj[path as keyof PaymobTransactionCallback];
  return String(value);
}

export function computePaymobHmac(obj: PaymobTransactionCallback, secret: string): string {
  const concatenated = HMAC_FIELD_ORDER.map((field) => fieldValue(obj, field)).join('');
  return createHmac('sha512', secret).update(concatenated).digest('hex');
}

export function verifyPaymobHmac(obj: PaymobTransactionCallback, secret: string, providedHmac: string): boolean {
  return computePaymobHmac(obj, secret).toLowerCase() === providedHmac.toLowerCase();
}
