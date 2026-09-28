import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SignOutButton } from '@/components/app/SignOutButton';

// Nav links are intentionally limited to routes that exist today (Phase 1: dashboard only).
// Practice, exams, bookmarks and settings are added to this nav as their own phases land
// (Section 10) rather than linking ahead to pages that don't exist yet.
export function AppHeader({ displayName }: { displayName: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-subtle bg-surface px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-semibold text-primary">
          PulseQ
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-secondary hover:text-primary">
            Dashboard
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-secondary">{displayName}</span>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
