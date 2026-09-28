import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-sm text-muted sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} PulseQ. Built for Egyptian medical students.</p>
        <div className="flex gap-4">
          <Link href="/sign-in" className="hover:text-secondary">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-secondary">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
