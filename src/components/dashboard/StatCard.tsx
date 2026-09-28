// Stat tile per the dataviz skill's figure contract: sentence-case label, no trailing colon;
// value in the default sans, proportional figures (never tabular-nums at this display size).
export function StatCard({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId?: string;
}) {
  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <p className="text-sm text-secondary">{label}</p>
      <p data-testid={testId} className="mt-1 text-3xl font-semibold text-primary">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
