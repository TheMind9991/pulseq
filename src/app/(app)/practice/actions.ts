'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { sessionBuilderSchema, type SessionBuilderInput } from '@/lib/schemas/session';
import { selectSessionQuestions } from '@/lib/sessions/selectQuestions';
import { checkDailyCap } from '@/lib/usage/dailyUsage';
import type { SessionFilters } from '@/types';

type StartSessionResult = { sessionId: string } | { error: string } | { capReached: 'questions' | 'exam_time' };

// Section 5.2 steps 1-2: server action that turns the builder's filters into a fixed
// questionIds order and creates the sessions doc. Question selection itself is shared with
// startExamSession — see src/lib/sessions/selectQuestions.ts and DECISIONS.md.
export async function startPracticeSession(input: SessionBuilderInput): Promise<StartSessionResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };

  const parsed = sessionBuilderSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid session filters.' };
  const { subjects, topics, difficulty, status, questionCount } = parsed.data;

  const { uid, profile } = current;
  const db = getAdminDb();

  // Section 7.3: hard stop before creating a new session, never mid-session — isPremium and
  // today's usage are both read server-side, never trusted from the client.
  const capCheck = await checkDailyCap(db, uid, profile.isPremium, 'tutor');
  if (capCheck.blocked) return { capReached: capCheck.cap };

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
    mode: 'tutor',
    questionIds: selection.questionIds,
    answers: {},
    filters,
    startedAt: FieldValue.serverTimestamp(),
    completedAt: null,
  });

  return { sessionId: sessionRef.id };
}
