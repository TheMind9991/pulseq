import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LocaleToggle } from '@/components/ui/LocaleToggle';
import { SignOutButton } from '@/components/app/SignOutButton';

export function AdminHeader({
  displayName,
  isAdmin,
  tenantName = 'PulseQ',
}: {
  displayName: string;
  isAdmin: boolean;
  tenantName?: string;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-subtle bg-surface px-6">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="text-sm font-semibold text-primary">
          {tenantName} Admin
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-secondary hover:text-primary">
            Overview
          </Link>
          <Link href="/admin/questions" className="text-sm text-secondary hover:text-primary">
            Questions
          </Link>
          <Link href="/admin/upload" className="text-sm text-secondary hover:text-primary">
            Upload
          </Link>
          <Link href="/admin/reports" className="text-sm text-secondary hover:text-primary">
            Reports
          </Link>
          {isAdmin && (
            <Link href="/admin/users" className="text-sm text-secondary hover:text-primary">
              Users
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-secondary hover:text-primary">
          Back to app
        </Link>
        <span className="text-sm text-secondary">{displayName}</span>
        <LocaleToggle />
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
