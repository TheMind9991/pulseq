import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyPaymobHmac, type PaymobTransactionCallback } from '@/lib/payments/paymobHmac';
import { parseUserIdFromMerchantOrderId } from '@/lib/payments/merchantOrderId';

const PREMIUM_PERIOD_DAYS = 30;

// Section 7.4: Paymob's "Transaction Processed Callback". Verified via the HMAC query param
// (paymobHmac.ts) before trusting anything in the body — never the other way around. Writes
// isPremium/premiumExpiresAt via the Admin SDK, which is the only thing firestore.rules lets
// touch those fields at all (Section 6/7.3). Always returns 200 once the payload has been
// read and (if valid) processed, matching webhook-provider convention — a non-2xx response
// makes most providers retry the same event indefinitely.
export async function POST(request: Request) {
  const hmac = new URL(request.url).searchParams.get('hmac');
  const secret = process.env.PAYMOB_HMAC_SECRET;

  if (!hmac || !secret) {
    return NextResponse.json({ error: 'Missing hmac or server not configured' }, { status: 400 });
  }

  let body: { obj?: PaymobTransactionCallback };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const obj = body.obj;
  if (!obj) return NextResponse.json({ error: 'Missing obj' }, { status: 400 });

  if (!verifyPaymobHmac(obj, secret, hmac)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Acknowledge (200) even for a failed/pending transaction — the signature was valid, there's
  // just nothing to upgrade. Only a successful, non-pending transaction grants premium.
  if (!obj.success || obj.pending) {
    return NextResponse.json({ ok: true, skipped: 'not a successful completed transaction' });
  }

  const uid = obj.order.merchant_order_id ? parseUserIdFromMerchantOrderId(obj.order.merchant_order_id) : null;
  if (!uid) {
    return NextResponse.json({ error: 'Could not resolve user from merchant_order_id' }, { status: 400 });
  }

  const premiumExpiresAt = new Date(Date.now() + PREMIUM_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  await getAdminDb()
    .collection('users')
    .doc(uid)
    .update({ isPremium: true, premiumExpiresAt, lastActiveAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
