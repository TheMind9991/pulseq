import type { Timestamp } from 'firebase/firestore';
import type { Locale, UserRole } from '@/lib/schemas/user';

// users/{userId} — engineering spec Section 3.1.
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  tenantId: string;
  faculty: string;
  academicYear: number;
  modules: string[];
  isPremium: boolean;
  premiumExpiresAt: Timestamp | null;
  locale: Locale;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

export const DEFAULT_TENANT_ID = 'pulseq-core';
