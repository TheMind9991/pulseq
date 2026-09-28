import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// Placeholder landing page. The real port of index.html (from pulseq-site.zip) happens in
// Phase 7 (Section 10) once the design system asset is available — see DECISIONS.md.
export default function MarketingPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold text-primary">PulseQ</h1>
      <p className="mt-4 text-lg text-secondary">
        Curriculum-aligned exam practice for Kasr Al Ainy and Egyptian medical students.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/sign-up">
          <Button>Get started</Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </main>
  );
}
