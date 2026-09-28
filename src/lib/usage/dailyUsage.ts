import 'server-only';
import { FieldValue, type Firestore, type WriteBatch } from 'firebase-admin/firestore';
import { DAILY_EXAM_SECONDS_CAP, DAILY_QUESTION_CAP, type DailyUsageDoc } from '@/types';
import { dailyUsageDocId, todayDateKey } from '@/lib/usage/dateKey';

export { todayDateKey, dailyUsageDocId };

export async function getDailyUsage(
  db: Firestore,
  userId: string,
  date: string,
): Promise<{ questionsAnswered: number; examSeconds: number }> {
  const snap = await db.collection('dailyUsage').doc(dailyUsageDocId(userId, date)).get();
  if (!snap.exists) return { questionsAnswered: 0, examSeconds: 0 };
  const data = snap.data() as DailyUsageDoc;
  return { questionsAnswered: data.questionsAnswered, examSeconds: data.examSeconds };
}

// Merges an increment into today's dailyUsage doc as part of a caller-owned batch — the same
// batch that writes the session/userQuestionStats update, so usage tracking can never be skipped
// by a client that calls the answer-submission path but not a separate "record usage" call
// (Section 7.2: "not a separate client-triggered call").
export function incrementDailyUsage(
  db: Firestore,
  batch: WriteBatch,
  params: { userId: string; date: string; questionsAnsweredDelta?: number; examSecondsDelta?: number },
): void {
  const { userId, date, questionsAnsweredDelta = 0, examSecondsDelta = 0 } = params;
  if (questionsAnsweredDelta === 0 && examSecondsDelta === 0) return;

  const ref = db.collection('dailyUsage').doc(dailyUsageDocId(userId, date));
  batch.set(
    ref,
    {
      userId,
      date,
      questionsAnswered: FieldValue.increment(questionsAnsweredDelta),
      examSeconds: FieldValue.increment(examSecondsDelta),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export type CapCheckResult =
  | { blocked: false }
  | { blocked: true; cap: 'questions' | 'exam_time' };

// Section 7.3: checked before starting a NEW session, never mid-session — an exam already in
// progress when a cap is crossed is allowed to finish (saveExamAnswer/finalizeExam never call
// this). isPremium bypasses both caps entirely.
export async function checkDailyCap(
  db: Firestore,
  userId: string,
  isPremium: boolean,
  mode: 'tutor' | 'timed_exam',
): Promise<CapCheckResult> {
  if (isPremium) return { blocked: false };

  const usage = await getDailyUsage(db, userId, todayDateKey());
  if (mode === 'tutor' && usage.questionsAnswered >= DAILY_QUESTION_CAP) {
    return { blocked: true, cap: 'questions' };
  }
  if (mode === 'timed_exam' && usage.examSeconds >= DAILY_EXAM_SECONDS_CAP) {
    return { blocked: true, cap: 'exam_time' };
  }
  return { blocked: false };
}
