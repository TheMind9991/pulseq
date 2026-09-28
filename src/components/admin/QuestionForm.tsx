'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionFormSchema, type QuestionFormInput, type OptionId } from '@/lib/schemas/question';
import { Button } from '@/components/ui/Button';

const OPTION_IDS: OptionId[] = ['A', 'B', 'C', 'D', 'E'];

const EMPTY_OPTIONS: QuestionFormInput['options'] = OPTION_IDS.slice(0, 4).map((id) => ({
  id,
  text: '',
  explanation: '',
}));

export function QuestionForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<QuestionFormInput>;
  onSubmit: (values: QuestionFormInput) => Promise<{ error: string } | { ok: true } | { questionId: string }>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      stem: '',
      options: EMPTY_OPTIONS,
      correctOptionId: 'A',
      correctExplanation: '',
      subject: '',
      topic: '',
      tagsRaw: '',
      difficulty: 2,
      sourceReviewed: false,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const correctOptionId = watch('correctOptionId');

  async function submit(values: QuestionFormInput) {
    setFormError(null);
    const result = await onSubmit(values);
    if ('error' in result) {
      setFormError(result.error);
      return;
    }
    if ('questionId' in result) {
      router.push(`/admin/questions/${result.questionId}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="max-w-2xl space-y-6">
      {formError && (
        <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
      )}

      <div>
        <label htmlFor="stem" className="mb-1 block text-sm text-secondary">
          Question stem
        </label>
        <textarea
          id="stem"
          rows={3}
          {...register('stem')}
          className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
        />
        {errors.stem && <p className="mt-1 text-sm text-danger">{errors.stem.message}</p>}
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm text-secondary">Options</legend>
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-md border border-subtle p-3">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id={`correct-${field.id}`}
                value={OPTION_IDS[index]}
                {...register('correctOptionId')}
                className="accent-[rgb(var(--color-accent))]"
              />
              <label htmlFor={`correct-${field.id}`} className="text-sm font-medium text-primary">
                Option {OPTION_IDS[index]} {correctOptionId === OPTION_IDS[index] && '(correct)'}
              </label>
            </div>
            <input
              {...register(`options.${index}.text` as const)}
              placeholder="Option text"
              className="mt-2 w-full rounded-md border border-subtle bg-base px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            <input
              {...register(`options.${index}.explanation` as const)}
              placeholder="Explanation (why this option is right/wrong)"
              className="mt-2 w-full rounded-md border border-subtle bg-base px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
            {fields.length > 2 && index === fields.length - 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-2 text-xs text-danger hover:underline"
              >
                Remove option {OPTION_IDS[index]}
              </button>
            )}
          </div>
        ))}
        {fields.length < 5 && (
          <button
            type="button"
            onClick={() => append({ id: OPTION_IDS[fields.length]!, text: '', explanation: '' })}
            className="text-sm text-accent hover:underline"
          >
            + Add option {OPTION_IDS[fields.length]}
          </button>
        )}
        {errors.correctOptionId && <p className="text-sm text-danger">{errors.correctOptionId.message}</p>}
      </fieldset>

      <div>
        <label htmlFor="correctExplanation" className="mb-1 block text-sm text-secondary">
          Correct-answer explanation
        </label>
        <textarea
          id="correctExplanation"
          rows={2}
          {...register('correctExplanation')}
          className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
        />
        {errors.correctExplanation && (
          <p className="mt-1 text-sm text-danger">{errors.correctExplanation.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="subject" className="mb-1 block text-sm text-secondary">
            Subject
          </label>
          <input
            id="subject"
            {...register('subject')}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
          {errors.subject && <p className="mt-1 text-sm text-danger">{errors.subject.message}</p>}
        </div>
        <div>
          <label htmlFor="topic" className="mb-1 block text-sm text-secondary">
            Topic
          </label>
          <input
            id="topic"
            {...register('topic')}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
          {errors.topic && <p className="mt-1 text-sm text-danger">{errors.topic.message}</p>}
        </div>
        <div>
          <label htmlFor="subtopic" className="mb-1 block text-sm text-secondary">
            Subtopic (optional)
          </label>
          <input
            id="subtopic"
            {...register('subtopic')}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="skillTag" className="mb-1 block text-sm text-secondary">
            Skill tag (optional)
          </label>
          <input
            id="skillTag"
            {...register('skillTag')}
            className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tagsRaw" className="mb-1 block text-sm text-secondary">
          Raw tags (comma-separated; kept for provenance)
        </label>
        <input
          id="tagsRaw"
          {...register('tagsRaw')}
          className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="difficulty" className="mb-1 block text-sm text-secondary">
          Difficulty
        </label>
        <select
          id="difficulty"
          {...register('difficulty', { valueAsNumber: true })}
          className="w-full rounded-md border border-subtle bg-base px-3 py-2 text-primary outline-none focus:border-accent"
        >
          <option value={1}>1 — Easy</option>
          <option value={2}>2 — Medium</option>
          <option value={3}>3 — Hard</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-primary">
        <input type="checkbox" {...register('sourceReviewed')} className="accent-[rgb(var(--color-accent))]" />
        Source already reviewed
      </label>

      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
