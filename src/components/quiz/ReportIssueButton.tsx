'use client';

import { useState, useTransition } from 'react';
import { createErrorReport } from '@/lib/errorReports/actions';

export function ReportIssueButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return <p className="mt-3 text-xs text-success">Thanks — this has been sent for review.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-xs text-muted hover:text-secondary hover:underline"
      >
        Report an issue with this question
      </button>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createErrorReport(questionId, reason);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  return (
    <div className="mt-3 rounded-md border border-subtle p-3">
      <label htmlFor={`report-reason-${questionId}`} className="mb-1 block text-xs text-secondary">
        What&apos;s wrong with this question?
      </label>
      <textarea
        id={`report-reason-${questionId}`}
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border border-subtle bg-base px-2 py-1.5 text-xs text-primary outline-none focus:border-accent"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          disabled={isPending || reason.trim().length < 3}
          onClick={submit}
          className="text-xs font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
