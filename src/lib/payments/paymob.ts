import 'server-only';

// Paymob's standard 3-step checkout flow (Section 7.4): authenticate -> create order -> request
// a payment key -> redirect the customer to the iframe URL built from that key. Chosen over
// Fawaterak after comparing both against the product PRD's required methods (Fawry, Vodafone
// Cash, cards) — see DECISIONS.md for the full reasoning. Endpoint shapes and the HMAC field
// order (paymobHmac.ts) follow Paymob's long-documented public API convention; neither has been
// exercised against a live sandbox in this build (no real credentials available) — verify before
// relying on this in production.
const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';
const PREMIUM_PRICE_EGP = 150;

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

async function paymobFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PAYMOB_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Paymob request to ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function authenticate(apiKey: string): Promise<string> {
  const { token } = await paymobFetch<{ token: string }>('/auth/tokens', { api_key: apiKey });
  return token;
}

async function createOrder(authToken: string, merchantOrderId: string, amountCents: number): Promise<number> {
  const order = await paymobFetch<{ id: number }>('/ecommerce/orders', {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: 'EGP',
    merchant_order_id: merchantOrderId,
    items: [],
  });
  return order.id;
}

async function requestPaymentKey(
  authToken: string,
  params: { orderId: number; amountCents: number; integrationId: string; billingData: PaymobBillingData },
): Promise<string> {
  const { token } = await paymobFetch<{ token: string }>('/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: params.amountCents,
    expiration: 3600,
    order_id: params.orderId,
    billing_data: {
      ...params.billingData,
      apartment: 'NA',
      floor: 'NA',
      street: 'NA',
      building: 'NA',
      city: 'NA',
      country: 'NA',
      state: 'NA',
    },
    currency: 'EGP',
    integration_id: Number(params.integrationId),
  });
  return token;
}

export interface CreatePaymobCheckoutParams {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  merchantOrderId: string;
  billingData: PaymobBillingData;
}

// Returns the iframe URL to redirect the customer to. Amount is fixed at the product PRD's
// EGP 150/month (Section 7.4) — there's no variable-priced flow in this app.
export async function createPaymobCheckout(params: CreatePaymobCheckoutParams): Promise<string> {
  const amountCents = PREMIUM_PRICE_EGP * 100;
  const authToken = await authenticate(params.apiKey);
  const orderId = await createOrder(authToken, params.merchantOrderId, amountCents);
  const paymentToken = await requestPaymentKey(authToken, {
    orderId,
    amountCents,
    integrationId: params.integrationId,
    billingData: params.billingData,
  });
  return `${PAYMOB_BASE_URL}/acceptance/iframes/${params.iframeId}?payment_token=${paymentToken}`;
}
