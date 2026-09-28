import 'server-only';
import { FieldValue, type Firestore, type WriteBatch } from 'firebase-admin/firestore';

export interface UpsertUserQuestionStatsParams {
  uid: string;
  questionId: string;
  subject: string;
  topic: string;
  isCorrect: boolean;
}

// Shared by submitAnswer (tutor — one call per answer, at answer time) and submitExam (exam —
// one call per question, at final submission time only; see DECISIONS.md for why exam mode
// doesn't update stats on every in-progress answer change). Queues onto the caller's batch
// rather than committing itself, so exam submission can write every question's stats plus the
// session doc in one atomic batch.
export async function upsertUserQuestionStats(
  db: Firestore,
  batch: WriteBatch,
  { uid, questionId, subject, topic, isCorrect }: UpsertUserQuestionStatsParams,
): Promise<void> {
  const statsRef = db.collection('userQuestionStats').doc(`${uid}_${questionId}`);
  const statsSnap = await statsRef.get();

  if (statsSnap.exists) {
    batch.update(statsRef, {
      timesSeen: FieldValue.increment(1),
      timesCorrect: FieldValue.increment(isCorrect ? 1 : 0),
      lastSeenAt: FieldValue.serverTimestamp(),
    });
  } else {
    batch.set(statsRef, {
      userId: uid,
      questionId,
      subject,
      topic,
      timesSeen: 1,
      timesCorrect: isCorrect ? 1 : 0,
      lastSeenAt: FieldValue.serverTimestamp(),
      bookmarked: false,
    });
  }
}
