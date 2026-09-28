'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createCheckout } from '@/app/(app)/settings/actions';

export function UpgradeButton() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setIsPending(true);
    const result = await createCheckout();
    if ('error' in result) {
      setError(result.error);
      setIsPending(false);
      return;
    }
    window.location.href = result.checkoutUrl;
  }

  return (
    <div>
      <Button onClick={onClick} disabled={isPending}>
        {isPending ? 'Starting checkout…' : 'Go unlimited — EGP 150/mo'}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
