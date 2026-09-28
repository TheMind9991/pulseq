import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CTABand() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-lg bg-accent px-8 py-12 text-center">
        <h2 className="text-2xl font-semibold text-accent-fg sm:text-3xl">
          Start practising in under two minutes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-accent-fg/90">
          Full access to the question bank from your first sign-up, free.
        </p>
        <Link href="/sign-up" className="mt-6 inline-block">
          <Button variant="secondary" className="h-12 px-6 text-base">
            Get started free
          </Button>
        </Link>
      </div>
    </section>
  );
}
