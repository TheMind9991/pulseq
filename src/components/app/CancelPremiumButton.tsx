'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cancelPremium } from '@/app/(app)/settings/actions';

export function CancelPremiumButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setIsPending(true);
    const result = await cancelPremium();
    if ('error' in result) {
      setError(result.error);
      setIsPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button variant="secondary" onClick={onClick} disabled={isPending}>
        {isPending ? 'Cancelling…' : 'Cancel'}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
