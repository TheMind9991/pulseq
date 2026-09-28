import Link from 'next/link';
import { Button } from '@/components/ui/Button';

function Check() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-success">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// Section 6.6: content is never gated by payment status — the only levers are ads and the two
// daily caps, so both plans list the exact same access, differing only on the rows that matter.
export function PricingGrid() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-center text-2xl font-semibold text-primary sm:text-3xl">
        One price. The whole question bank either way.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-secondary">
        Every subject, every topic, tutor mode and timed exams — free or paid. Upgrading only
        removes ads and the daily limits.
      </p>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-subtle bg-surface p-6">
          <h3 className="text-lg font-semibold text-primary">Free</h3>
          <p className="mt-1 text-3xl font-semibold text-primary">EGP 0</p>
          <ul className="mt-6 space-y-3 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <Check /> Full question bank, every subject
            </li>
            <li className="flex items-start gap-2">
              <Check /> Tutor mode and timed exams
            </li>
            <li className="flex items-start gap-2">
              <Check /> Progress tracking by topic
            </li>
            <li className="flex items-start gap-2">
              <Check /> 100 questions/day, 60 exam minutes/day
            </li>
            <li className="flex items-start gap-2">
              <Check /> Ads on the dashboard and session builder
            </li>
          </ul>
          <Link href="/sign-up" className="mt-6 block">
            <Button variant="secondary" className="w-full">
              Get started free
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border-2 border-accent bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Unlimited</p>
          <p className="mt-1 text-3xl font-semibold text-primary">
            EGP 150<span className="text-base font-normal text-secondary">/month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <Check /> Everything in Free
            </li>
            <li className="flex items-start gap-2">
              <Check /> No daily question or exam-time limit
            </li>
            <li className="flex items-start gap-2">
              <Check /> No ads, anywhere
            </li>
            <li className="flex items-start gap-2">
              <Check /> Cancel anytime
            </li>
          </ul>
          <Link href="/sign-up" className="mt-6 block">
            <Button className="w-full">Go unlimited</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
