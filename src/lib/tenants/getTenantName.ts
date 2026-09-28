import 'server-only';
import { cache } from 'react';
import { getAdminDb } from '@/lib/firebase/admin';
import type { TenantDoc } from '@/types';

const FALLBACK_NAME = 'PulseQ';

// Falls back rather than failing if the tenant doc hasn't been provisioned yet (e.g. this read
// races setCustomClaims's own ensureTenantExists on a brand-new tenant's very first request) —
// showing the fallback name for a moment is harmless, unlike blocking the page on it.
export const getTenantName = cache(async (tenantId: string): Promise<string> => {
  const snap = await getAdminDb().collection('tenants').doc(tenantId).get();
  if (!snap.exists) return FALLBACK_NAME;
  const data = snap.data() as TenantDoc;
  return data.name || FALLBACK_NAME;
});
