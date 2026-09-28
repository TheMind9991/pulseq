'use client';

import { QuestionCard } from '@/components/quiz/QuestionCard';
import type { SessionQuestion } from '@/components/quiz/PracticeSession';

interface ReviewAnswer {
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

// Section 5.3: "a results/review screen (list of all questions with correct/incorrect +
// explanations, reusing QuestionCard in a read-only 'reviewed' state)". feedbackMode="always" so
// even a skipped question still shows the correct option, not just the ones the student answered.
export function ExamReview({
  questions,
  answers,
  score,
}: {
  questions: SessionQuestion[];
  answers: Record<string, ReviewAnswer>;
  score: { correct: number; total: number };
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div
        data-testid="exam-score-banner"
        className="mb-6 rounded-lg border border-accent bg-accent/10 px-4 py-3"
      >
        <p className="text-lg font-semibold text-primary">
          {score.correct} / {score.total} correct
        </p>
        <p className="text-sm text-secondary">Exam complete — review your answers and explanations below.</p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => {
          const answer = answers[question.id] ?? { selectedOptionId: null, isCorrect: null };
          return (
            <div key={question.id}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Question {index + 1}
              </p>
              <QuestionCard
                stem={question.stem}
                options={question.options}
                correctOptionId={question.correctOptionId}
                correctExplanation={question.correctExplanation}
                selectedOptionId={answer.selectedOptionId}
                isCorrect={answer.isCorrect}
                feedbackMode="always"
                onSelect={() => {}}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
