'use client';

import { useEffect, useState } from 'react';

export const LOCALE_STORAGE_KEY = 'pulseq-locale';
type Locale = 'en' | 'ar';

function applyLocale(locale: Locale) {
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable (private mode, blocked storage) — locale still applies for this load
  }
}

// Mirrors ThemeToggle.tsx exactly: a client-only preference, not tied to the signed-in user's
// document, so it works identically on the logged-out marketing site and inside the app (Section
// 4.5). Flips dir/lang immediately; see DECISIONS.md for why UI copy itself stays English for now
// while the RTL layout is fully verified — the two are separate concerns.
export function LocaleToggle() {
  const [locale, setLocale] = useState<Locale | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute('lang') as Locale | null;
    setLocale(current === 'ar' ? 'ar' : 'en');
  }, []);

  if (!locale) return null;

  const next: Locale = locale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={() => {
        applyLocale(next);
        setLocale(next);
      }}
      aria-label={`Switch to ${next === 'ar' ? 'Arabic' : 'English'}`}
      className="inline-flex h-9 items-center justify-center rounded-md border border-subtle bg-surface px-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-hover"
    >
      {next === 'ar' ? 'العربية' : 'EN'}
    </button>
  );
}
