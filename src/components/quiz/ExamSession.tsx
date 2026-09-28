'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveExamAnswer, submitExam } from '@/app/(app)/exams/[sessionId]/actions';
import { QuestionRail, type RailStatus } from '@/components/quiz/QuestionRail';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { ExamCountdown } from '@/components/quiz/ExamCountdown';
import { Button } from '@/components/ui/Button';
import type { SessionQuestion } from '@/components/quiz/PracticeSession';

interface AnswerState {
  selectedOptionId: string | null;
}

// Section 5.3: in-progress timed exam. No ExplanationPanel or correct/incorrect styling
// (feedbackMode="hidden" throughout — see QuestionCard/OptionRow), and unlike tutor mode an
// answer stays editable until submission. The countdown auto-submits on expiry; the "Submit
// exam" button does the same thing explicitly.
export function ExamSession({
  sessionId,
  questions,
  initialAnswers,
  startedAtMillis,
  durationSeconds,
}: {
  sessionId: string;
  questions: SessionQuestion[];
  initialAnswers: Record<string, AnswerState>;
  startedAtMillis: number;
  durationSeconds: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null; // questions is always non-empty; satisfies noUncheckedIndexedAccess
  const currentQuestionId = currentQuestion.id;

  const currentAnswer = answers[currentQuestionId] ?? { selectedOptionId: null };
  const answeredCount = questions.filter((q) => answers[q.id]?.selectedOptionId != null).length;
  const unansweredCount = questions.length - answeredCount;

  async function onSelectOption(optionId: string) {
    if (saving || submitting) return;
    setSaving(true);
    setError(null);
    const result = await saveExamAnswer(sessionId, currentQuestionId, optionId);
    setSaving(false);
    if ('error' in result) {
      setError('Could not save your answer — check your connection and try again.');
      return;
    }
    if (result.status === 'expired') {
      router.refresh(); // time's up server-side — re-renders into the review screen
      return;
    }
    setAnswers((prev) => ({ ...prev, [currentQuestionId]: { selectedOptionId: optionId } }));
  }

  async function onSubmit() {
    if (submitting) return;
    setSubmitting(true);
    await submitExam(sessionId);
    router.refresh();
  }

  function getRailStatus(index: number): RailStatus {
    const question = questions[index];
    const a = question ? answers[question.id] : undefined;
    return a?.selectedOptionId != null ? 'answered' : 'unanswered';
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-subtle bg-surface px-6 py-3">
        <span className="text-sm text-secondary">
          {answeredCount} / {questions.length} answered
        </span>
        <ExamCountdown startedAtMillis={startedAtMillis} durationSeconds={durationSeconds} onExpire={onSubmit} />
      </div>
      <QuestionRail
        count={questions.length}
        currentIndex={currentIndex}
        getStatus={getRailStatus}
        onSelect={setCurrentIndex}
      />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <QuestionCard
          questionId={currentQuestion.id}
          stem={currentQuestion.stem}
          options={currentQuestion.options}
          correctOptionId={currentQuestion.correctOptionId}
          correctExplanation={currentQuestion.correctExplanation}
          selectedOptionId={currentAnswer.selectedOptionId}
          isCorrect={null}
          feedbackMode="hidden"
          onSelect={onSelectOption}
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="text-sm text-secondary hover:text-primary disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="text-sm text-secondary hover:text-primary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        <div className="mt-8 border-t border-subtle pt-6">
          {unansweredCount > 0 && (
            <p className="mb-3 text-sm text-secondary">
              {unansweredCount} question{unansweredCount === 1 ? '' : 's'} still unanswered.
            </p>
          )}
          <Button onClick={onSubmit} disabled={submitting} data-testid="submit-exam-button">
            {submitting ? 'Submitting…' : 'Submit exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}
