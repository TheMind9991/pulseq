import { notFound } from 'next/navigation';
import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { QuestionEditClient } from '@/components/admin/QuestionEditClient';
import {
  publishQuestion,
  retireQuestion,
  returnToDraft,
  submitForReview,
  updateQuestionContent,
} from '@/app/admin/questions/actions';
import type { QuestionFormInput } from '@/lib/schemas/question';
import type { QuestionDoc } from '@/types';

export default async function AdminQuestionDetailPage({ params }: { params: { id: string } }) {
  const serverUser = await getServerUser();
  if (!serverUser?.tenantId) return null; // AdminLayout already redirects otherwise

  const db = getAdminDb();
  const snap = await db.collection('questions').doc(params.id).get();
  if (!snap.exists) notFound();
  const question = snap.data() as QuestionDoc;
  if (question.tenantId !== serverUser.tenantId) notFound();

  // Built here (server side) rather than passed as the raw QuestionDoc — that type carries
  // Firestore Timestamp fields, which aren't valid Server->Client Component props (see
  // QuestionEditClient's comment).
  const defaultValues: Partial<QuestionFormInput> = {
    stem: question.stem,
    stemAr: question.stemAr,
    options: question.options,
    correctOptionId: question.correctOptionId,
    correctExplanation: question.correctExplanation,
    correctExplanationAr: question.correctExplanationAr,
    reference: question.reference,
    imageUrl: question.imageUrl,
    subject: question.subject,
    topic: question.topic,
    subtopic: question.subtopic,
    skillTag: question.skillTag,
    tagsRaw: question.tagsRaw,
    difficulty: question.difficulty,
    examWeight: question.examWeight,
    sourceReviewed: question.sourceReviewed,
    authorNote: question.authorNote,
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-primary">Edit question</h1>
      <QuestionEditClient
        status={question.status}
        defaultValues={defaultValues}
        isAuthor={question.authorId === serverUser.uid}
        onUpdate={updateQuestionContent.bind(null, params.id)}
        onSubmitForReview={submitForReview.bind(null, params.id)}
        onPublish={publishQuestion.bind(null, params.id)}
        onReturnToDraft={returnToDraft.bind(null, params.id)}
        onRetire={retireQuestion.bind(null, params.id)}
      />
    </div>
  );
}
