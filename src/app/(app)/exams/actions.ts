'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { examBuilderSchema, type ExamBuilderInput } from '@/lib/schemas/session';
import { selectSessionQuestions } from '@/lib/sessions/selectQuestions';
import type { SessionFilters } from '@/types';

type StartSessionResult = { sessionId: string } | { error: string };

// Section 5.3: "Same flow as 5.2 but: mode: 'timed_exam', a duration is set at session
// creation..." — shares question selection with startPracticeSession (selectSessionQuestions).
export async function startExamSession(input: ExamBuilderInput): Promise<StartSessionResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };

  const parsed = examBuilderSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid exam settings.' };
  const { subjects, topics, difficulty, status, questionCount, durationMinutes } = parsed.data;

  const { uid, profile } = current;
  const db = getAdminDb();

  const selection = await selectSessionQuestions(db, {
    tenantId: profile.tenantId,
    uid,
    subjects,
    topics,
    difficulty,
    status,
    questionCount,
  });
  if ('error' in selection) return selection;

  const filters: SessionFilters = {};
  if (subjects && subjects.length > 0) filters.subjects = subjects;
  if (topics && topics.length > 0) filters.topics = topics;
  if (difficulty && difficulty.length > 0) filters.difficulty = difficulty;
  if (status) filters.status = status;

  const sessionRef = db.collection('sessions').doc();
  await sessionRef.set({
    tenantId: profile.tenantId,
    userId: uid,
    mode: 'timed_exam',
    questionIds: selection.questionIds,
    answers: {},
    filters,
    durationSeconds: durationMinutes * 60,
    startedAt: FieldValue.serverTimestamp(),
    completedAt: null,
  });

  return { sessionId: sessionRef.id };
}
