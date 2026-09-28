import { OptionRow } from '@/components/quiz/OptionRow';
import { ExplanationPanel } from '@/components/quiz/ExplanationPanel';
import { ReportIssueButton } from '@/components/quiz/ReportIssueButton';
import type { QuestionOption } from '@/lib/schemas/question';

// 'immediate' (tutor, Section 5.2): reveal once this question has an answer, then lock.
// 'hidden' (exam, in progress, Section 5.3): never reveal, stays editable.
// 'always' (exam review, Section 5.3): always reveal, even for a skipped question, read-only.
export type FeedbackMode = 'immediate' | 'hidden' | 'always';

interface QuestionCardProps {
  questionId: string;
  stem: string;
  options: QuestionOption[];
  correctOptionId: string;
  correctExplanation: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  feedbackMode: FeedbackMode;
  onSelect: (optionId: string) => void;
}

export function QuestionCard({
  questionId,
  stem,
  options,
  correctOptionId,
  correctExplanation,
  selectedOptionId,
  isCorrect,
  feedbackMode,
  onSelect,
}: QuestionCardProps) {
  const answered = selectedOptionId !== null;
  const showCorrectness = feedbackMode === 'always' || (feedbackMode === 'immediate' && answered);

  return (
    <div className="rounded-lg border border-subtle bg-surface p-6">
      <p className="mb-5 whitespace-pre-wrap text-base text-primary">{stem}</p>
      <div className="space-y-2">
        {options.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            isSelected={selectedOptionId === option.id}
            isCorrectOption={correctOptionId === option.id}
            answered={answered}
            feedbackMode={feedbackMode}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
      {showCorrectness && <ExplanationPanel isCorrect={isCorrect} correctExplanation={correctExplanation} />}
      {feedbackMode !== 'hidden' && <ReportIssueButton questionId={questionId} />}
    </div>
  );
}
