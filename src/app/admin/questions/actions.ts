'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getServerUser, type ServerUser } from '@/lib/auth/getServerUser';
import { questionFormSchema, type QuestionFormInput } from '@/lib/schemas/question';
import type { QuestionDoc } from '@/types';

type ActionResult = { ok: true } | { error: string };
type CreateResult = { questionId: string } | { error: string };
type AuthResult = { ok: true; serverUser: ServerUser & { tenantId: string } } | { ok: false; error: string };

async function requireEditor(): Promise<AuthResult> {
  const serverUser = await getServerUser();
  if (!serverUser) return { ok: false, error: 'You must be signed in.' };
  if (serverUser.role !== 'editor' && serverUser.role !== 'admin') {
    return { ok: false, error: 'Only editors and admins can manage questions.' };
  }
  if (!serverUser.tenantId) return { ok: false, error: 'Missing tenant.' };
  return { ok: true, serverUser: { ...serverUser, tenantId: serverUser.tenantId } };
}

// Always created as a draft (Section 5.5.3/5.6 — mirrored by the `status == 'draft'` requirement
// on `allow create` in firestore.rules, which is the actual enforcement; this check just gives a
// friendlier error than a raw permission-denied).
export async function createQuestion(input: QuestionFormInput): Promise<CreateResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid question content.' };

  const db = getAdminDb();
  const ref = db.collection('questions').doc();
  await ref.set({
    ...parsed.data,
    status: 'draft',
    tenantId: auth.serverUser.tenantId,
    authorId: auth.serverUser.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/admin/questions');
  return { questionId: ref.id };
}

// Content-only edit — never touches `status` or `reviewedById` (those go through the dedicated
// review-queue actions below, which is the one narrow path firestore.rules' publish-transition
// check expects).
export async function updateQuestionContent(questionId: string, input: QuestionFormInput): Promise<ActionResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid question content.' };

  const db = getAdminDb();
  const ref = db.collection('questions').doc(questionId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Question not found.' };
  const existing = snap.data() as QuestionDoc;
  if (existing.tenantId !== auth.serverUser.tenantId) return { error: 'Question not found.' };

  await ref.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
  revalidatePath('/admin/questions');
  revalidatePath(`/admin/questions/${questionId}`);
  return { ok: true };
}

export async function submitForReview(questionId: string): Promise<ActionResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const db = getAdminDb();
  const ref = db.collection('questions').doc(questionId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Question not found.' };
  const existing = snap.data() as QuestionDoc;
  if (existing.tenantId !== auth.serverUser.tenantId) return { error: 'Question not found.' };
  if (existing.status !== 'draft') return { error: 'Only a draft can be submitted for review.' };

  await ref.update({ status: 'in_review', updatedAt: FieldValue.serverTimestamp() });
  revalidatePath('/admin/questions');
  revalidatePath(`/admin/questions/${questionId}`);
  return { ok: true };
}

// The author != reviewer guarantee is enforced by firestore.rules (the real enforcement layer,
// per Section 6) — this check exists only to surface a clear message instead of a raw
// permission-denied from the SDK when someone tries to review their own question.
export async function publishQuestion(questionId: string): Promise<ActionResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const db = getAdminDb();
  const ref = db.collection('questions').doc(questionId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Question not found.' };
  const existing = snap.data() as QuestionDoc;
  if (existing.tenantId !== auth.serverUser.tenantId) return { error: 'Question not found.' };
  if (existing.status !== 'in_review') return { error: 'Only a question in review can be published.' };
  if (existing.authorId === auth.serverUser.uid) {
    return { error: 'You cannot publish your own question — it must be reviewed by someone else.' };
  }

  await ref.update({
    status: 'published',
    reviewedById: auth.serverUser.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath('/admin/questions');
  revalidatePath(`/admin/questions/${questionId}`);
  return { ok: true };
}

// Sends a question back to draft (e.g. a reviewer found issues) rather than publishing it.
export async function returnToDraft(questionId: string): Promise<ActionResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const db = getAdminDb();
  const ref = db.collection('questions').doc(questionId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Question not found.' };
  const existing = snap.data() as QuestionDoc;
  if (existing.tenantId !== auth.serverUser.tenantId) return { error: 'Question not found.' };

  await ref.update({ status: 'draft', updatedAt: FieldValue.serverTimestamp() });
  revalidatePath('/admin/questions');
  revalidatePath(`/admin/questions/${questionId}`);
  return { ok: true };
}

// Retiring is a status update, not a delete — firestore.rules denies `delete` outright
// (Section 5.6: published questions may be answered in past sessions, so history stays intact).
export async function retireQuestion(questionId: string): Promise<ActionResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const db = getAdminDb();
  const ref = db.collection('questions').doc(questionId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Question not found.' };
  const existing = snap.data() as QuestionDoc;
  if (existing.tenantId !== auth.serverUser.tenantId) return { error: 'Question not found.' };

  await ref.update({ status: 'retired', updatedAt: FieldValue.serverTimestamp() });
  revalidatePath('/admin/questions');
  revalidatePath(`/admin/questions/${questionId}`);
  return { ok: true };
}
