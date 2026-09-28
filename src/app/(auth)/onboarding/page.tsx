'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useUser } from '@/lib/auth/useUser';
import { onboardingSchema, type OnboardingInput } from '@/lib/schemas/user';
import { ACADEMIC_YEARS, FACULTIES, MODULES } from '@/lib/constants/curriculum';
import { Button } from '@/components/ui/Button';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { modules: [] },
  });

  useEffect(() => {
    if (user?.displayName) setValue('displayName', user.displayName);
  }, [user, setValue]);

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
    if (!loading && profile) router.replace('/dashboard');
  }, [loading, user, profile, router]);

  const selectedModules = watch('modules') ?? [];

  async function onSubmit(values: OnboardingInput) {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: values.displayName,
      faculty: values.faculty,
      academicYear: values.academicYear,
      modules: values.modules,
      tenantId: 'pulseq-core',
      locale: 'en',
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      // role, isPremium, premiumExpiresAt intentionally omitted — rules forbid setting them from
      // the client, and setCustomClaims.ts (Cloud Function) fills in the defaults server-side.
    });
    router.push('/dashboard');
  }

  if (loading || !user || profile) return null;

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Tell us about you</h1>
      <p className="mb-6 text-sm text-secondary">This tailors your question bank to your curriculum.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm text-secondary">
            Full name
          </label>
          <input
            id="displayName"
            {...register('displayName')}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
          {errors.displayName && <p className="mt-1 text-sm text-danger">{errors.displayName.message}</p>}
        </div>

        <div>
          <label htmlFor="faculty" className="mb-1 block text-sm text-secondary">
            Faculty
          </label>
          <select
            id="faculty"
            {...register('faculty')}
            defaultValue=""
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          >
            <option value="" disabled>
              Select your faculty
            </option>
            {FACULTIES.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty}
              </option>
            ))}
          </select>
          {errors.faculty && <p className="mt-1 text-sm text-danger">{errors.faculty.message}</p>}
        </div>

        <div>
          <label htmlFor="academicYear" className="mb-1 block text-sm text-secondary">
            Academic year
          </label>
          <select
            id="academicYear"
            {...register('academicYear')}
            defaultValue=""
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          >
            <option value="" disabled>
              Select your year
            </option>
            {ACADEMIC_YEARS.map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
          {errors.academicYear && <p className="mt-1 text-sm text-danger">{errors.academicYear.message}</p>}
        </div>

        <fieldset>
          <legend className="mb-1 block text-sm text-secondary">Modules you&apos;re studying</legend>
          <div className="grid grid-cols-2 gap-2">
            {MODULES.map((module) => (
              <label key={module} className="flex items-center gap-2 text-sm text-primary">
                <input
                  type="checkbox"
                  value={module}
                  checked={selectedModules.includes(module)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedModules, module]
                      : selectedModules.filter((m) => m !== module);
                    setValue('modules', next, { shouldValidate: true });
                  }}
                  className="accent-[var(--color-accent)]"
                />
                {module}
              </label>
            ))}
          </div>
          {errors.modules && <p className="mt-1 text-sm text-danger">{errors.modules.message}</p>}
        </fieldset>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
