import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">
        Built around the Kasr Al Ainy curriculum
      </p>
      <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-5xl">
        Exam-style practice that actually matches your syllabus
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-secondary">
        Stop revising from scattered WhatsApp PDFs. Practise curriculum-mapped MCQs in tutor mode,
        sit timed mock exams, and see exactly which topics need more work — every question
        reviewed by a second editor before it&apos;s published.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/sign-up">
          <Button className="h-12 px-6 text-base">Get started free</Button>
        </Link>
        <Link href="#pricing">
          <Button variant="secondary" className="h-12 px-6 text-base">
            See pricing
          </Button>
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted">
        Free forever for the full question bank &middot; no card required
      </p>
    </section>
  );
}
