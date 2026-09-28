'use client';

import { useEffect, useRef, useState } from 'react';
import { computeRemainingSeconds, formatCountdown } from '@/lib/sessions/examTiming';

// Section 5.3: "a visible countdown timer runs client-side (synced against startedAt +
// durationSeconds server timestamp so refreshing doesn't reset it)". Recomputed from wall-clock
// time on every tick (not decremented locally), so it self-corrects after a backgrounded tab and
// survives a refresh/resume unchanged.
export function ExamCountdown({
  startedAtMillis,
  durationSeconds,
  onExpire,
}: {
  startedAtMillis: number;
  durationSeconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    computeRemainingSeconds(startedAtMillis, durationSeconds, Date.now()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(computeRemainingSeconds(startedAtMillis, durationSeconds, Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAtMillis, durationSeconds]);

  const expiredRef = useRef(false);
  useEffect(() => {
    if (remaining <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);

  const isLow = remaining <= 60;

  return (
    <span
      data-testid="exam-countdown"
      className={`rounded-md border px-3 py-1.5 text-sm font-medium tabular-nums ${
        isLow ? 'border-danger bg-danger/10 text-danger' : 'border-subtle bg-surface text-primary'
      }`}
    >
      {formatCountdown(remaining)}
    </span>
  );
}
