'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startPracticeSession } from '@/app/(app)/practice/actions';
import { DEFAULT_QUESTION_COUNT, QUESTION_COUNT_OPTIONS } from '@/lib/constants/practice';
import { useSessionFilters } from '@/lib/sessions/useSessionFilters';
import { SessionFilterFields } from '@/components/quiz/SessionFilterFields';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { CapReachedNotice } from '@/components/app/CapReachedNotice';
import { AdSlot } from '@/components/ads/AdSlot';

export default function PracticeBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fills from the dashboard's "Practise weak topics" button (Section 5.4), e.g.
  // /practice?topic=Cardiology&topic=Endocrine. Subjects are derived from the topics so the
  // subject chips reflect the selection too, rather than leaving them unset.
  const initialTopics = useMemo(() => searchParams.getAll('topic'), [searchParams]);

  const filters = useSessionFilters({ topics: initialTopics });
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [error, setError] = useState<string | null>(null);
  const [capReached, setCapReached] = useState<'questions' | 'exam_time' | null>(null);
  const [starting, setStarting] = useState(false);

  async function onStart() {
    setError(null);
    setCapReached(null);
    setStarting(true);
    const result = await startPracticeSession({
      subjects: filters.subjects.length > 0 ? filters.subjects : undefined,
      topics: filters.topics.length > 0 ? filters.topics : undefined,
      difficulty: filters.difficulty.length > 0 ? filters.difficulty : undefined,
      status: filters.status,
      questionCount,
    });
    if ('capReached' in result) {
      setCapReached(result.capReached);
      setStarting(false);
      return;
    }
    if ('error' in result) {
      setError(result.error);
      setStarting(false);
      return;
    }
    router.push(`/practice/${result.sessionId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-primary">Start a practice session</h1>
      <p className="mt-1 text-secondary">Untimed tutor mode — see the explanation after every answer.</p>

      <div className="mt-6">
        <AdSlot />
      </div>

      <div className="mt-8 space-y-6">
        {capReached && <CapReachedNotice cap={capReached} />}
        <SessionFilterFields {...filters} />

        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Number of questions</h2>
          <div className="flex flex-wrap gap-2">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <Chip
                key={count}
                label={String(count)}
                selected={questionCount === count}
                onClick={() => setQuestionCount(count)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={onStart} disabled={starting || capReached !== null}>
          {starting ? 'Starting…' : 'Start'}
        </Button>
      </div>
    </div>
  );
}
