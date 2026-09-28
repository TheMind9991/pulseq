import type { Config } from 'tailwindcss';

// Colors are wired to CSS custom properties from src/styles/globals.css so that
// bg-accent / text-primary / border-subtle (etc.) resolve to design tokens rather
// than hardcoded hex values anywhere in component code (see engineering spec 4.1).
const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--color-bg-base)',
        surface: 'var(--color-bg-surface)',
        'surface-hover': 'var(--color-bg-surface-hover)',

        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',

        subtle: 'var(--color-border-subtle)',
        border: 'var(--color-border-default)',

        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-fg': 'var(--color-accent-fg)',

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
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
