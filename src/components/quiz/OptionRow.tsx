import type { QuestionOption } from '@/lib/schemas/question';
import type { FeedbackMode } from '@/components/quiz/QuestionCard';

export function OptionRow({
  option,
  isSelected,
  isCorrectOption,
  answered,
  feedbackMode,
  onSelect,
}: {
  option: QuestionOption;
  isSelected: boolean;
  isCorrectOption: boolean;
  answered: boolean;
  feedbackMode: FeedbackMode;
  onSelect: () => void;
}) {
  // 'immediate' (tutor mode): correctness shows only once this question has an answer, and then
  // locks. 'hidden' (exam, in progress): never shows correctness, stays editable — Section 5.3.
  // 'always' (exam review): always shows correctness, even for a question the student skipped,
  // so the correct option is still visible to learn from.
  const showCorrectness = feedbackMode === 'always' || (feedbackMode === 'immediate' && answered);
  const locked = showCorrectness;

  let stateClasses = 'border-subtle bg-surface hover:bg-surface-hover';
  if (showCorrectness) {
    if (isCorrectOption) {
      stateClasses = 'border-success bg-success/10';
    } else if (isSelected) {
      stateClasses = 'border-danger bg-danger/10';
    } else {
      stateClasses = 'border-subtle bg-surface opacity-60';
    }
  } else if (isSelected) {
    stateClasses = 'border-accent bg-accent/10';
  }

  return (
    <div>
      <button
        type="button"
        data-testid={`option-${option.id}`}
        disabled={locked}
        onClick={onSelect}
        className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${stateClasses} ${
          locked ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-subtle text-xs font-medium text-secondary">
          {option.id}
        </span>
        <span className="text-primary">{option.text}</span>
      </button>
      {showCorrectness && isSelected && option.explanation && (
        <p className="mt-1 px-4 text-sm text-secondary">{option.explanation}</p>
      )}
    </div>
  );
}
