'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startExamSession } from '@/app/(app)/exams/actions';
import { DEFAULT_QUESTION_COUNT, QUESTION_COUNT_OPTIONS } from '@/lib/constants/practice';
import { DEFAULT_EXAM_DURATION_MINUTES, EXAM_DURATION_OPTIONS_MINUTES } from '@/lib/constants/exam';
import { useSessionFilters } from '@/lib/sessions/useSessionFilters';
import { SessionFilterFields } from '@/components/quiz/SessionFilterFields';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { CapReachedNotice } from '@/components/app/CapReachedNotice';
import { AdSlot } from '@/components/ads/AdSlot';

export default function ExamBuilderPage() {
  const router = useRouter();
  const filters = useSessionFilters();
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_EXAM_DURATION_MINUTES);
  const [error, setError] = useState<string | null>(null);
  const [capReached, setCapReached] = useState<'questions' | 'exam_time' | null>(null);
  const [starting, setStarting] = useState(false);

  async function onStart() {
    setError(null);
    setCapReached(null);
    setStarting(true);
    const result = await startExamSession({
      subjects: filters.subjects.length > 0 ? filters.subjects : undefined,
      topics: filters.topics.length > 0 ? filters.topics : undefined,
      difficulty: filters.difficulty.length > 0 ? filters.difficulty : undefined,
      status: filters.status,
      questionCount,
      durationMinutes,
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
    router.push(`/exams/${result.sessionId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-primary">Start a timed exam</h1>
      <p className="mt-1 text-secondary">
        No feedback until you submit or time runs out — mimics the real exam format.
      </p>

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

        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Duration</h2>
          <div className="flex flex-wrap gap-2">
            {EXAM_DURATION_OPTIONS_MINUTES.map((minutes) => (
              <Chip
                key={minutes}
                label={`${minutes} min`}
                selected={durationMinutes === minutes}
                onClick={() => setDurationMinutes(minutes)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={onStart} disabled={starting || capReached !== null}>
          {starting ? 'Starting…' : 'Start exam'}
        </Button>
      </div>
    </div>
  );
}
