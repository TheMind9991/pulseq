'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type ActionResult = { ok: true } | { error: string };

const ROLES = ['student', 'editor', 'admin'] as const;

export function RoleSelect({
  userId,
  currentRole,
  disabled,
  onChangeRole,
}: {
  userId: string;
  currentRole: string;
  disabled: boolean;
  onChangeRole: (userId: string, role: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(role: string) {
    setError(null);
    startTransition(async () => {
      const result = await onChangeRole(userId, role);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <select
        value={currentRole}
        disabled={disabled || isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-subtle bg-base px-2 py-1 text-sm text-primary outline-none focus:border-accent disabled:opacity-50"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
