export type RailStatus = 'unanswered' | 'correct' | 'incorrect';

export function QuestionRail({
  count,
  currentIndex,
  getStatus,
  onSelect,
}: {
  count: number;
  currentIndex: number;
  getStatus: (index: number) => RailStatus;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-subtle bg-surface px-6 py-3">
      {Array.from({ length: count }, (_, i) => {
        const status = getStatus(i);
        const isCurrent = i === currentIndex;
        const statusClasses =
          status === 'correct'
            ? 'border-success bg-success text-accent-fg'
            : status === 'incorrect'
              ? 'border-danger bg-danger text-accent-fg'
              : 'border-subtle bg-base text-secondary';

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isCurrent}
            aria-label={`Question ${i + 1}${status !== 'unanswered' ? `, answered ${status}` : ''}`}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors ${statusClasses} ${
              isCurrent ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
