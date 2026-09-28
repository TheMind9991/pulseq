'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { QuestionStatus } from '@/lib/schemas/question';

type ActionResult = { ok: true } | { error: string };

export function QuestionReviewPanel({
  status,
  isAuthor,
  onSubmitForReview,
  onPublish,
  onReturnToDraft,
  onRetire,
}: {
  status: QuestionStatus;
  isAuthor: boolean;
  onSubmitForReview: () => Promise<ActionResult>;
  onPublish: () => Promise<ActionResult>;
  onReturnToDraft: () => Promise<ActionResult>;
  onRetire: () => Promise<ActionResult>;
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
    <div className="rounded-lg border border-subtle bg-surface p-4">
      <p className="text-sm text-secondary">
        Status: <span className="font-medium text-primary">{status.replace('_', ' ')}</span>
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {status === 'draft' && (
          <Button disabled={isPending} onClick={() => run(onSubmitForReview)}>
            Submit for review
          </Button>
        )}
        {status === 'in_review' && (
          <>
            <Button
              disabled={isPending || isAuthor}
              title={isAuthor ? 'You cannot publish your own question' : undefined}
              onClick={() => run(onPublish)}
            >
              Publish
            </Button>
            <Button variant="secondary" disabled={isPending} onClick={() => run(onReturnToDraft)}>
              Send back to draft
            </Button>
          </>
        )}
        {status === 'published' && (
          <Button variant="secondary" disabled={isPending} onClick={() => run(onRetire)}>
            Retire
          </Button>
        )}
        {isAuthor && status === 'in_review' && (
          <p className="w-full text-xs text-muted">
            You authored this question — another editor or admin must publish it.
          </p>
        )}
      </div>
    </div>
  );
}
