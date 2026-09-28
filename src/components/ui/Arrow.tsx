// A directional glyph (→ / ←) authored assuming LTR reading order, mirrored automatically when
// the page is RTL (dir="rtl" on <html>, driven by LocaleToggle.tsx) — so "forward"/"next" always
// visually points toward the reading-forward direction and "back"/"previous" always points
// toward reading-backward, in either direction. Tailwind's rtl: variant targets `[dir="rtl"] &`
// by default, matching the dir attribute LocaleToggle/the root layout's init script set directly.
// Deliberately not aria-hidden: the glyph is part of these buttons'/links' accessible name
// (e.g. "Next →"), same as before this component existed — only its visual direction changes.
export function Arrow({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rtl:-scale-x-100">{children}</span>;
}
