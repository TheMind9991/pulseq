'use client';

import { useEffect, useState } from 'react';
import { submitAnswer } from '@/app/(app)/practice/[sessionId]/actions';
import { ProgressStrip } from '@/components/quiz/ProgressStrip';
import { QuestionRail, type RailStatus } from '@/components/quiz/QuestionRail';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Arrow } from '@/components/ui/Arrow';
import type { QuestionOption } from '@/lib/schemas/question';

export interface SessionQuestion {
  id: string;
  stem: string;
  options: QuestionOption[];
  correctOptionId: string;
  correctExplanation: string;
}

interface AnswerState {
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

// Section 5.2 step 3 / 4.3. Fed server-rendered initial data by page.tsx (session + all question
// docs fetched upfront, since a session is small — tens of questions, not thousands) and
// resumes at the first unanswered question so an interrupted session picks back up correctly.
export function PracticeSession({
  sessionId,
  questions,
  initialAnswers,
  initiallyCompleted,
}: {
  sessionId: string;
  questions: SessionQuestion[];
  initialAnswers: Record<string, AnswerState>;
  initiallyCompleted: boolean;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = questions.findIndex((q) => answers[q.id]?.selectedOptionId == null);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(() => Date.now());
  const [completed, setCompleted] = useState(initiallyCompleted);

  useEffect(() => {
    setQuestionStartedAt(Date.now());
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null; // questions is always non-empty; satisfies noUncheckedIndexedAccess
  const currentQuestionId = currentQuestion.id; // plain string, so it narrows cleanly inside closures below

  const currentAnswer = answers[currentQuestion.id] ?? { selectedOptionId: null, isCorrect: null };
  const answeredCount = questions.filter((q) => answers[q.id]?.selectedOptionId != null).length;

  async function onSelectOption(optionId: string) {
    if (currentAnswer.selectedOptionId !== null || submitting) return;
    setSubmitting(true);
    setError(null);
    const timeSpentSeconds = Math.round((Date.now() - questionStartedAt) / 1000);
    const result = await submitAnswer(sessionId, currentQuestionId, optionId, timeSpentSeconds);
    setSubmitting(false);
    if ('error' in result) {
      setError('Could not save your answer — check your connection and try again.');
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: { selectedOptionId: optionId, isCorrect: result.isCorrect },
    }));
    if (result.completed) setCompleted(true);
  }

  function getRailStatus(index: number): RailStatus {
    const question = questions[index];
    const a = question ? answers[question.id] : undefined;
    if (!a || a.selectedOptionId == null) return 'unanswered';
    return a.isCorrect ? 'correct' : 'incorrect';
  }

  return (
    <div>
      <ProgressStrip answeredCount={answeredCount} total={questions.length} />
      <QuestionRail
        count={questions.length}
        currentIndex={currentIndex}
        getStatus={getRailStatus}
        onSelect={setCurrentIndex}
      />
      <div className="mx-auto max-w-3xl px-6 py-8">
        {completed && (
          <div
            data-testid="session-complete-banner"
            className="mb-4 rounded-md border border-accent bg-accent/10 px-4 py-3 text-sm text-primary"
          >
            Session complete — {questions.filter((q) => answers[q.id]?.isCorrect === true).length} /{' '}
            {questions.length} correct.
          </div>
        )}
        <QuestionCard
          questionId={currentQuestion.id}
          stem={currentQuestion.stem}
          options={currentQuestion.options}
          correctOptionId={currentQuestion.correctOptionId}
          correctExplanation={currentQuestion.correctExplanation}
          selectedOptionId={currentAnswer.selectedOptionId}
          isCorrect={currentAnswer.isCorrect}
          feedbackMode="immediate"
          onSelect={onSelectOption}
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="text-sm text-secondary hover:text-primary disabled:opacity-40"
          >
            <Arrow>←</Arrow> Previous
          </button>
          <button
            type="button"
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="text-sm text-secondary hover:text-primary disabled:opacity-40"
          >
            Next <Arrow>→</Arrow>
          </button>
        </div>
      </div>
    </div>
  );
}
