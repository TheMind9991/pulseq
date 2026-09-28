'use client';

import { QuestionForm } from '@/components/admin/QuestionForm';
import { createQuestion } from '@/app/admin/questions/actions';

export default function NewQuestionPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-primary">New question</h1>
      <QuestionForm onSubmit={createQuestion} submitLabel="Create draft" />
    </div>
  );
}
