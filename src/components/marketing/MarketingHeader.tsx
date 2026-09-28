import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';

export function MarketingHeader() {
  return (
    <header className="border-b border-subtle bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold text-primary">
          PulseQ
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/sign-in" className="text-sm text-secondary hover:text-primary">
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button>Get started free</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
