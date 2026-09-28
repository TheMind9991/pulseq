export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        selected
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-subtle bg-surface text-secondary hover:bg-surface-hover'
      }`}
    >
      {label}
    </button>
  );
}
