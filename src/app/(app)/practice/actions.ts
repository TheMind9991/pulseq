'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { sessionBuilderSchema, type SessionBuilderInput } from '@/lib/schemas/session';
import type { QuestionDoc, SessionFilters, UserQuestionStatsDoc } from '@/types';

type StartSessionResult = { sessionId: string } | { error: string };

// Section 5.2 steps 1-2: server action that turns the builder's filters into a fixed
// questionIds order and creates the sessions doc. See DECISIONS.md for why this fetches all
// tenant-scoped published questions and filters/ranks in application code rather than composing
// a multi-field Firestore query — fine at Phase 2's seed-data scale, revisit as content grows.
export async function startPracticeSession(input: SessionBuilderInput): Promise<StartSessionResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };

  const parsed = sessionBuilderSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid session filters.' };
  const { subjects, topics, difficulty, status, questionCount } = parsed.data;

  const { uid, profile } = current;
  const db = getAdminDb();

  const questionsSnap = await db
    .collection('questions')
    .where('tenantId', '==', profile.tenantId)
    .where('status', '==', 'published')
    .get();

  let candidates = questionsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as QuestionDoc) }));

  if (subjects && subjects.length > 0) {
    candidates = candidates.filter((q) => subjects.includes(q.subject));
  }
  if (topics && topics.length > 0) {
    candidates = candidates.filter((q) => topics.includes(q.topic));
  }
  if (difficulty && difficulty.length > 0) {
    candidates = candidates.filter((q) => difficulty.includes(q.difficulty));
  }

  if (candidates.length === 0) {
    return { error: 'No published questions match your filters yet.' };
  }

  // userQuestionStats doubles as the "seen" set (unseen/incorrect filters) and the
  // least-recently-seen ranking signal (Section 5.2).
  const statsSnap = await db.collection('userQuestionStats').where('userId', '==', uid).get();
  const statsByQuestionId = new Map<string, UserQuestionStatsDoc>();
  statsSnap.docs.forEach((doc) => {
    const stats = doc.data() as UserQuestionStatsDoc;
    statsByQuestionId.set(stats.questionId, stats);
  });

  if (status === 'unseen') {
    candidates = candidates.filter((q) => !statsByQuestionId.has(q.id));
  } else if (status === 'incorrect') {
    candidates = candidates.filter((q) => {
      const stats = statsByQuestionId.get(q.id);
      return stats !== undefined && stats.timesCorrect < stats.timesSeen;
    });
  } else if (status === 'flagged') {
    candidates = candidates.filter((q) => statsByQuestionId.get(q.id)?.bookmarked === true);
  }

  if (candidates.length === 0) {
    return { error: 'No questions match your filters yet — try broadening them.' };
  }

  // Least-recently-seen first; never-seen questions (no stats doc) sort first of all.
  candidates.sort((a, b) => {
    const aSeenAt = statsByQuestionId.get(a.id)?.lastSeenAt?.toMillis() ?? -Infinity;
    const bSeenAt = statsByQuestionId.get(b.id)?.lastSeenAt?.toMillis() ?? -Infinity;
    return aSeenAt - bSeenAt;
  });

  const questionIds = candidates.slice(0, questionCount).map((q) => q.id);

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
    questionIds,
    answers: {},
    filters,
    startedAt: FieldValue.serverTimestamp(),
    completedAt: null,
  });

  return { sessionId: sessionRef.id };
}
