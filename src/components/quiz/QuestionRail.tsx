// 'answered' is exam-mode-only: a question has a saved answer but correctness isn't revealed
// yet (Section 5.3) — distinct from 'correct'/'incorrect', which tutor mode uses immediately and
// exam mode only reaches on the post-submission review screen.
export type RailStatus = 'unanswered' | 'answered' | 'correct' | 'incorrect';

const STATUS_CLASSES: Record<RailStatus, string> = {
  correct: 'border-success bg-success text-accent-fg',
  incorrect: 'border-danger bg-danger text-accent-fg',
  answered: 'border-accent bg-accent text-accent-fg',
  unanswered: 'border-subtle bg-base text-secondary',
};

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

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isCurrent}
            aria-label={`Question ${i + 1}${status !== 'unanswered' ? `, ${status === 'answered' ? 'answered' : `answered ${status}`}` : ''}`}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors ${STATUS_CLASSES[status]} ${
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
