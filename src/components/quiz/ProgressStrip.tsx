import Link from 'next/link';

export function ProgressStrip({ answeredCount, total }: { answeredCount: number; total: number }) {
  const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="flex items-center justify-between border-b border-subtle bg-surface px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-secondary">
          {answeredCount} / {total} answered
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link href="/practice" className="text-sm text-secondary hover:text-primary">
        Save &amp; exit
      </Link>
    </div>
  );
}
