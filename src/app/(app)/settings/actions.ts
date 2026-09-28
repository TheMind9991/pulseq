'use server';

import { getAdminDb } from '@/lib/firebase/admin';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { createPaymobCheckout } from '@/lib/payments/paymob';
import { buildMerchantOrderId } from '@/lib/payments/merchantOrderId';

type CreateCheckoutResult = { checkoutUrl: string } | { error: string };
type CancelResult = { ok: true } | { error: string };

export async function createCheckout(): Promise<CreateCheckoutResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };
  if (current.profile.isPremium) return { error: 'You already have PulseQ Unlimited.' };

  const apiKey = process.env.PAYMOB_API_KEY;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID;
  const iframeId = process.env.PAYMOB_IFRAME_ID;
  if (!apiKey || !integrationId || !iframeId) {
    return { error: 'Payments are not configured yet. See SETUP.md.' };
  }

  const [firstName, ...rest] = current.profile.displayName.trim().split(/\s+/);

  try {
    const checkoutUrl = await createPaymobCheckout({
      apiKey,
      integrationId,
      iframeId,
      merchantOrderId: buildMerchantOrderId(current.uid),
      billingData: {
        first_name: firstName || 'PulseQ',
        last_name: rest.join(' ') || 'Student',
        email: current.profile.email,
        phone_number: 'NA',
      },
    });
    return { checkoutUrl };
  } catch {
    return { error: 'Could not start checkout — please try again.' };
  }
}

// There's no auto-renewing charge to cancel in this build's payment model (see DECISIONS.md —
// each month is a fresh manual payment, not a silent card-token recharge), so "cancel" simply
// turns unlimited off now rather than waiting for premiumExpiresAt to pass — for a student who
// wants ads/caps back immediately rather than leaving it running out the clock.
export async function cancelPremium(): Promise<CancelResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };
  if (!current.profile.isPremium) return { error: 'You do not currently have PulseQ Unlimited.' };

  await getAdminDb().collection('users').doc(current.uid).update({ isPremium: false });
  return { ok: true };
}
