import type { QuestionOption } from '@/lib/schemas/question';

export function OptionRow({
  option,
  isSelected,
  isCorrectOption,
  answered,
  onSelect,
}: {
  option: QuestionOption;
  isSelected: boolean;
  isCorrectOption: boolean;
  answered: boolean;
  onSelect: () => void;
}) {
  let stateClasses = 'border-subtle bg-surface hover:bg-surface-hover';
  if (answered) {
    if (isCorrectOption) {
      stateClasses = 'border-success bg-success/10';
    } else if (isSelected) {
      stateClasses = 'border-danger bg-danger/10';
    } else {
      stateClasses = 'border-subtle bg-surface opacity-60';
    }
  }

  return (
    <div>
      <button
        type="button"
        data-testid={`option-${option.id}`}
        disabled={answered}
        onClick={onSelect}
        className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${stateClasses} ${
          answered ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-subtle text-xs font-medium text-secondary">
          {option.id}
        </span>
        <span className="text-primary">{option.text}</span>
      </button>
      {answered && isSelected && option.explanation && (
        <p className="mt-1 px-4 text-sm text-secondary">{option.explanation}</p>
      )}
    </div>
  );
}
