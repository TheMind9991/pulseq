import { describe, expect, it } from 'vitest';
import { onboardingSchema } from '@/lib/schemas/user';

const validInput = {
  displayName: 'Sara Ahmed',
  faculty: 'Faculty of Medicine, Cairo University (Kasr Al Ainy)',
  academicYear: 3,
  modules: ['Internal Medicine', 'Pharmacology'],
};

describe('onboardingSchema', () => {
  it('accepts a fully valid submission', () => {
    const result = onboardingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('coerces a string academicYear (native <select> values) to a number', () => {
    const result = onboardingSchema.safeParse({ ...validInput, academicYear: '3' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.academicYear).toBe(3);
  });

  it('rejects an academic year outside 1-6', () => {
    const result = onboardingSchema.safeParse({ ...validInput, academicYear: 7 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty modules selection', () => {
    const result = onboardingSchema.safeParse({ ...validInput, modules: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a faculty not in the reference list', () => {
    const result = onboardingSchema.safeParse({ ...validInput, faculty: 'Some Other University' });
    expect(result.success).toBe(false);
  });

  it('rejects a blank display name', () => {
    const result = onboardingSchema.safeParse({ ...validInput, displayName: '   ' });
    expect(result.success).toBe(false);
  });
});
