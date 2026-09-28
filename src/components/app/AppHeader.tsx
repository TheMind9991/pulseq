import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LocaleToggle } from '@/components/ui/LocaleToggle';
import { SignOutButton } from '@/components/app/SignOutButton';

// Nav links are intentionally limited to routes that exist today (Phase 1: dashboard; Phase 2:
// + practice; Phase 4: + exams; Phase 6: + settings). Bookmarks are added if/when their own
// phase lands (Section 10) rather than linking ahead to a page that doesn't exist yet.
export function AppHeader({
  displayName,
  showAdminLink,
  tenantName = 'PulseQ',
}: {
  displayName: string;
  showAdminLink: boolean;
  tenantName?: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-subtle bg-surface px-6">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-semibold text-primary">
          {tenantName}
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-secondary hover:text-primary">
            Dashboard
          </Link>
          <Link href="/practice" className="text-sm text-secondary hover:text-primary">
            Practice
          </Link>
          <Link href="/exams" className="text-sm text-secondary hover:text-primary">
            Exams
          </Link>
          {showAdminLink && (
            <Link href="/admin" className="text-sm text-secondary hover:text-primary">
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-sm text-secondary hover:text-primary">
          Settings
        </Link>
        <span className="text-sm text-secondary">{displayName}</span>
        <LocaleToggle />
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
