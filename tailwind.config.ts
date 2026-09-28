import type { Config } from 'tailwindcss';

// Colors are wired to CSS custom properties from src/styles/globals.css so that
// bg-accent / text-primary / border-subtle (etc.) resolve to design tokens rather
// than hardcoded hex values anywhere in component code (see engineering spec 4.1).
//
// Each token is stored in globals.css as an "R G B" triplet and wrapped here as
// rgb(var(--x) / <alpha-value>) — the standard Tailwind pattern that makes opacity modifiers
// (bg-success/10, border-accent/50, ...) work on custom CSS-variable colors. A bare
// `var(--x)` pointing at a hex value would make Tailwind silently skip generating any CSS for
// a `/<opacity>` utility.
function withOpacity(cssVar: string) {
  return `rgb(var(${cssVar}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: withOpacity('--color-bg-base'),
        surface: withOpacity('--color-bg-surface'),
        'surface-hover': withOpacity('--color-bg-surface-hover'),

        primary: withOpacity('--color-text-primary'),
        secondary: withOpacity('--color-text-secondary'),
        muted: withOpacity('--color-text-muted'),

        subtle: withOpacity('--color-border-subtle'),
        border: withOpacity('--color-border-default'),

        accent: withOpacity('--color-accent'),
        'accent-hover': withOpacity('--color-accent-hover'),
        'accent-fg': withOpacity('--color-accent-fg'),

        success: withOpacity('--color-success'),
        warning: withOpacity('--color-warning'),
        danger: withOpacity('--color-danger'),
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
      },
    },
  },
  plugins: [],
};

export default config;
