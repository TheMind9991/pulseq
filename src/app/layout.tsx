import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthSync } from '@/components/auth/AuthSync';

export const metadata: Metadata = {
  title: 'PulseQ',
  description: 'Curriculum-aligned question bank practice for Egyptian medical students.',
};

// Sets data-theme on <html> before first paint so the correct theme renders immediately
// (no flash of the wrong theme). Mirrors the storage key used by ThemeToggle.tsx.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('pulseq-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

// Sets lang/dir on <html> before first paint, same rationale as the theme script above — mirrors
// the storage key used by LocaleToggle.tsx (Section 4.5: locale drives RTL, not a separate
// setting). English remains the only fully-translated locale (Section 4.5's own allowance); this
// only flips document direction and lang, so every screen's RTL layout can be verified with real
// user content even before a full Arabic string catalog exists — see DECISIONS.md.
const LOCALE_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('pulseq-locale');
    var locale = stored === 'ar' ? 'ar' : 'en';
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  } catch (e) {
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_INIT_SCRIPT }} />
      </head>
      <body>
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
