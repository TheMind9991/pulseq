// Pure — shared by createCheckout (encode) and the webhook route (decode). Split on the LAST
// underscore for the timestamp suffix, keeping everything else as the uid, since a Firebase uid
// isn't guaranteed to be underscore-free.
const PREFIX = 'pulseq_';

export function buildMerchantOrderId(uid: string, now: number = Date.now()): string {
  return `${PREFIX}${uid}_${now}`;
}

export function parseUserIdFromMerchantOrderId(merchantOrderId: string): string | null {
  if (!merchantOrderId.startsWith(PREFIX)) return null;
  const withoutPrefix = merchantOrderId.slice(PREFIX.length);
  const lastUnderscore = withoutPrefix.lastIndexOf('_');
  if (lastUnderscore <= 0) return null;
  return withoutPrefix.slice(0, lastUnderscore);
}
