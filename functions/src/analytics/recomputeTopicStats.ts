import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Kept in sync with src/lib/analytics/computeTopicAccuracy.ts — duplicated rather than shared
// since functions/ is a separate TypeScript package with no access to src/ (see DECISIONS.md).
type TopicStatus = 'strong' | 'watch' | 'weak';
const STRONG_THRESHOLD = 0.75;
const WATCH_THRESHOLD = 0.5;

function computeTopicStatus(accuracy: number): TopicStatus {
  if (accuracy >= STRONG_THRESHOLD) return 'strong';
  if (accuracy >= WATCH_THRESHOLD) return 'watch';
  return 'weak';
}

interface UserQuestionStatsData {
  userId: string;
  subject: string;
  topic: string;
  timesSeen: number;
  timesCorrect: number;
}

// Section 3.5: rolls userQuestionStats up into a cheap single-document read per topic
// (userTopicStats/{userId}_{topic}) rather than an aggregation query at dashboard render time.
// Triggered on every userQuestionStats write, which only ever happens from
// src/app/(app)/practice/[sessionId]/actions.ts's submitAnswer (Admin SDK — triggers fire on
// Admin SDK writes same as client writes).
export const recomputeTopicStats = onDocumentWritten('userQuestionStats/{docId}', async (event) => {
  const after = event.data?.after;
  const before = event.data?.before;
  const data = (after?.exists ? after.data() : before?.data()) as UserQuestionStatsData | undefined;
  if (!data) return;

  const { userId, topic, subject } = data;
  const db = getFirestore();

  // Re-query rather than trust the triggering doc alone — recomputes the whole topic aggregate
  // from every currently-existing userQuestionStats doc, which is also correct on delete (the
  // deleted doc is already gone from this query by the time the trigger fires).
  const snap = await db
    .collection('userQuestionStats')
    .where('userId', '==', userId)
    .where('topic', '==', topic)
    .get();

  let questionsAnswered = 0;
  let totalSeen = 0;
  let totalCorrect = 0;

  snap.docs.forEach((doc) => {
    const stats = doc.data() as UserQuestionStatsData;
    if (stats.timesSeen > 0) {
      questionsAnswered += 1;
      totalSeen += stats.timesSeen;
      totalCorrect += stats.timesCorrect;
    }
  });

  const accuracy = totalSeen > 0 ? totalCorrect / totalSeen : 0;

  await db.doc(`userTopicStats/${userId}_${topic}`).set({
    userId,
    subject,
    topic,
    questionsAnswered,
    accuracy,
    status: computeTopicStatus(accuracy),
    updatedAt: FieldValue.serverTimestamp(),
  });
});
