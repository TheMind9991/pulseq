export function ExplanationPanel({
  isCorrect,
  correctExplanation,
}: {
  isCorrect: boolean;
  correctExplanation: string;
}) {
  return (
    <div
      data-testid="explanation-panel"
      className={`mt-4 rounded-md border p-4 ${
        isCorrect ? 'border-success bg-success/10' : 'border-danger bg-danger/10'
      }`}
    >
      <p className={`mb-1 text-sm font-medium ${isCorrect ? 'text-success' : 'text-danger'}`}>
        {isCorrect ? 'Correct' : 'Incorrect'}
      </p>
      <p className="text-sm text-primary">{correctExplanation}</p>
    </div>
  );
}
