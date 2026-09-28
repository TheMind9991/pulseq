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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
