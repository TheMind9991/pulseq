export interface Testimonial {
  quote: string;
  name: string;
  detail: string; // e.g. "Year 4, Kasr Al Ainy"
}

// Built per Section 4.3's component list, but not composed into app/(marketing)/page.tsx yet —
// PulseQ has no real users pre-launch, and this build has no source of genuine testimonials to
// put here. Deliberately takes `testimonials` as a required prop with no default/sample data, so
// it can never be reused with fabricated quotes by accident. Wire it in once real ones exist
// (see DECISIONS.md).
export function TestimonialGrid({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-center text-2xl font-semibold text-primary sm:text-3xl">
        What students are saying
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="rounded-lg border border-subtle bg-surface p-6">
            <blockquote className="text-sm text-primary">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 text-sm text-secondary">
              <span className="font-medium text-primary">{t.name}</span> &middot; {t.detail}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
