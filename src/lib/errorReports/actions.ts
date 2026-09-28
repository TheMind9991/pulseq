'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getServerUser } from '@/lib/auth/getServerUser';
import { createErrorReportSchema } from '@/lib/schemas/errorReport';

type ActionResult = { ok: true } | { error: string };

// The "Report an issue" affordance on QuestionCard (practice + exam review) — any signed-in
// student may file one against any question they can see; editors/admins triage them at
// /admin/reports. Shared (not route-scoped) since QuestionCard is rendered from both the
// practice and exam feature areas.
export async function createErrorReport(questionId: string, reason: string): Promise<ActionResult> {
  const serverUser = await getServerUser();
  if (!serverUser) return { error: 'You must be signed in.' };
  if (!serverUser.tenantId) return { error: 'Missing tenant.' };

  const parsed = createErrorReportSchema.safeParse({ questionId, reason });
  if (!parsed.success) return { error: 'Please describe the issue in a few words.' };

  const db = getAdminDb();
  await db.collection('errorReports').doc().set({
    questionId: parsed.data.questionId,
    tenantId: serverUser.tenantId,
    reportedByUserId: serverUser.uid,
    reason: parsed.data.reason,
    status: 'open',
    createdAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
}
