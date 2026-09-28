import { z } from 'zod';
import { ACADEMIC_YEARS, FACULTIES, MODULES } from '@/lib/constants/curriculum';

export const userRoleSchema = z.enum(['student', 'editor', 'admin', 'institution_admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const localeSchema = z.enum(['en', 'ar']);
export type Locale = z.infer<typeof localeSchema>;

// Shared client/server validation for the onboarding form (Section 5.1). Re-run server-side
// before the users/{uid} document is written — never trust client validation alone.
export const onboardingSchema = z.object({
  // Not itemized in the engineering spec's onboarding field list (Section 5.1), but the
  // users/{uid} schema (Section 3.1) requires displayName and email/password sign-up collects
  // no name — so it's captured here, pre-filled from the Firebase Auth profile when available
  // (e.g. Google sign-in already has one). See DECISIONS.md.
  displayName: z.string().trim().min(1, 'Enter your name').max(100),
  faculty: z.enum(FACULTIES),
  academicYear: z.coerce
    .number()
    .int()
    .refine((year): year is (typeof ACADEMIC_YEARS)[number] => (ACADEMIC_YEARS as readonly number[]).includes(year), {
      message: 'Select a valid academic year',
    }),
  modules: z.array(z.enum(MODULES)).min(1, 'Select at least one module'),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
