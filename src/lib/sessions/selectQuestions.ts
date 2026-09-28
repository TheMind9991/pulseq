import 'server-only';
import type { Firestore } from 'firebase-admin/firestore';
import type { QuestionDoc, UserQuestionStatsDoc } from '@/types';
import type { SessionStatusFilter } from '@/lib/schemas/session';

export interface SelectQuestionsParams {
  tenantId: string;
  uid: string;
  subjects?: string[];
  topics?: string[];
  difficulty?: number[];
  status?: SessionStatusFilter;
  questionCount: number;
}

export type SelectQuestionsResult = { questionIds: string[] } | { error: string };

// Shared by startPracticeSession and startExamSession (Section 5.2/5.3 — "Same flow as 5.2
// but..."). See DECISIONS.md for why this fetches all tenant-scoped published questions and
// filters/ranks in application code rather than composing a multi-field Firestore query — fine
// at the current seed-data scale, revisit as content grows.
export async function selectSessionQuestions(
  db: Firestore,
  { tenantId, uid, subjects, topics, difficulty, status, questionCount }: SelectQuestionsParams,
): Promise<SelectQuestionsResult> {
  const questionsSnap = await db
    .collection('questions')
    .where('tenantId', '==', tenantId)
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

  return { questionIds: candidates.slice(0, questionCount).map((q) => q.id) };
}
