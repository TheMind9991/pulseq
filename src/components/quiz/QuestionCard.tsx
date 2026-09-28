import { OptionRow } from '@/components/quiz/OptionRow';
import { ExplanationPanel } from '@/components/quiz/ExplanationPanel';
import type { QuestionOption } from '@/lib/schemas/question';

interface QuestionCardProps {
  stem: string;
  options: QuestionOption[];
  correctOptionId: string;
  correctExplanation: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  onSelect: (optionId: string) => void;
}

export function QuestionCard({
  stem,
  options,
  correctOptionId,
  correctExplanation,
  selectedOptionId,
  isCorrect,
  onSelect,
}: QuestionCardProps) {
  const answered = selectedOptionId !== null;

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
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
      {answered && isCorrect !== null && (
        <ExplanationPanel isCorrect={isCorrect} correctExplanation={correctExplanation} />
      )}
    </div>
  );
}
