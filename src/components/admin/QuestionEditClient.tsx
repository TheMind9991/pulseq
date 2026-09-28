'use client';

import { QuestionForm } from '@/components/admin/QuestionForm';
import { QuestionReviewPanel } from '@/components/admin/QuestionReviewPanel';
import type { QuestionFormInput, QuestionStatus } from '@/lib/schemas/question';

type ActionResult = { ok: true } | { error: string };

// Takes plain, already-serializable data only (status + a QuestionFormInput-shaped object) rather
// than the raw QuestionDoc — that type carries Firestore Timestamp fields (createdAt/updatedAt),
// and passing a class instance like Timestamp from a Server Component to a Client Component as a
// prop fails at runtime ("Only plain objects... can be passed"), even though it typechecks fine
// (Timestamp is a valid TS type, just not RSC-serializable). The server page builds
// `defaultValues` itself so no Timestamp ever crosses the boundary.
export function QuestionEditClient({
  status,
  defaultValues,
  isAuthor,
  onUpdate,
  onSubmitForReview,
  onPublish,
  onReturnToDraft,
  onRetire,
}: {
  status: QuestionStatus;
  defaultValues: Partial<QuestionFormInput>;
  isAuthor: boolean;
  onUpdate: (input: QuestionFormInput) => Promise<ActionResult>;
  onSubmitForReview: () => Promise<ActionResult>;
  onPublish: () => Promise<ActionResult>;
  onReturnToDraft: () => Promise<ActionResult>;
  onRetire: () => Promise<ActionResult>;
}) {
  return (
    <div className="space-y-6">
      <QuestionReviewPanel
        status={status}
        isAuthor={isAuthor}
        onSubmitForReview={onSubmitForReview}
        onPublish={onPublish}
        onReturnToDraft={onReturnToDraft}
        onRetire={onRetire}
      />
      <QuestionForm defaultValues={defaultValues} onSubmit={onUpdate} submitLabel="Save changes" />
    </div>
  );
}
