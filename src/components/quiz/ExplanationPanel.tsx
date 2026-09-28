// isCorrect is null for a question shown on the exam review screen that the student left
// unanswered — still worth showing the explanation, framed neutrally rather than as correct or
// incorrect.
export function ExplanationPanel({
  isCorrect,
  correctExplanation,
}: {
  isCorrect: boolean | null;
  correctExplanation: string;
}) {
  const tone =
    isCorrect === null
      ? { border: 'border-subtle', bg: 'bg-surface', text: 'text-secondary', label: 'Not answered' }
      : isCorrect
        ? { border: 'border-success', bg: 'bg-success/10', text: 'text-success', label: 'Correct' }
        : { border: 'border-danger', bg: 'bg-danger/10', text: 'text-danger', label: 'Incorrect' };

  return (
    <div data-testid="explanation-panel" className={`mt-4 rounded-md border p-4 ${tone.border} ${tone.bg}`}>
      <p className={`mb-1 text-sm font-medium ${tone.text}`}>{tone.label}</p>
      <p className="text-sm text-primary">{correctExplanation}</p>
    </div>
  );
}
