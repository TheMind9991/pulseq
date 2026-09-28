'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type ActionResult = { ok: true } | { error: string };

export function ReportRowActions({
  onResolve,
  onDismiss,
}: {
  onResolve: () => Promise<ActionResult>;
  onDismiss: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={isPending} onClick={() => run(onResolve)}>
          Resolve
        </Button>
        <Button variant="secondary" disabled={isPending} onClick={() => run(onDismiss)}>
          Dismiss
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
