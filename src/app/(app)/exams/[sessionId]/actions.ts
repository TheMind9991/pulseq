'use server';

import { FieldValue, type Firestore, type DocumentReference } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { upsertUserQuestionStats } from '@/lib/sessions/userQuestionStats';
import { computeRemainingSeconds } from '@/lib/sessions/examTiming';
import { incrementDailyUsage, todayDateKey } from '@/lib/usage/dailyUsage';
import type { QuestionDoc, SessionAnswer, SessionDoc } from '@/types';

type SaveExamAnswerResult = { status: 'saved' } | { status: 'expired' } | { error: string };
type SubmitExamResult = { correct: number; total: number } | { error: string };

// Scores every question from whatever's in sessions.answers, upserts userQuestionStats once per
// answered question (not on every in-progress change — see DECISIONS.md), and marks the session
// completedAt+score. Shared by submitExam (explicit) and saveExamAnswer's expiry path (the
// client's timer hit zero server-side before the browser's own auto-submit fired).
async function finalizeExam(
  db: Firestore,
  sessionRef: DocumentReference,
  session: SessionDoc,
  uid: string,
): Promise<{ correct: number; total: number }> {
  const questionRefs = session.questionIds.map((id) => db.collection('questions').doc(id));
  const questionDocs = questionRefs.length > 0 ? await db.getAll(...questionRefs) : [];

  const batch = db.batch();

  const results = await Promise.all(
    questionDocs
      .filter((doc) => doc.exists)
      .map(async (doc) => {
        const question = doc.data() as QuestionDoc;
        const existing = session.answers[doc.id];
        const selectedOptionId = existing?.selectedOptionId ?? null;
        const isCorrect = selectedOptionId !== null ? selectedOptionId === question.correctOptionId : null;

        if (selectedOptionId !== null) {
          await upsertUserQuestionStats(db, batch, {
            uid,
            questionId: doc.id,
            subject: question.subject,
            topic: question.topic,
            isCorrect: isCorrect === true,
          });
        }

        const answer: SessionAnswer = {
          selectedOptionId,
          isCorrect,
          flaggedForReview: existing?.flaggedForReview ?? false,
          timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
        };
        return { questionId: doc.id, answer };
      }),
  );

  const finalAnswers: Record<string, SessionAnswer> = {};
  let correctCount = 0;
  for (const { questionId, answer } of results) {
    finalAnswers[questionId] = answer;
    if (answer.isCorrect) correctCount += 1;
  }

  batch.update(sessionRef, {
    answers: finalAnswers,
    completedAt: FieldValue.serverTimestamp(),
    score: { correct: correctCount, total: session.questionIds.length },
  });

  // Section 7.2: examSeconds is booked once, here, at finalization — not incrementally per
  // saveExamAnswer call — using actual elapsed wall-clock time capped at the session's allotted
  // duration (an early submission books less than the full budget; this function only ever runs
  // once per session, guarded by both callers' completedAt === null check, so there's no
  // double-counting to worry about).
  const elapsedSeconds = Math.floor((Date.now() - session.startedAt.toMillis()) / 1000);
  const examSecondsDelta = Math.max(0, Math.min(session.durationSeconds ?? 0, elapsedSeconds));
  incrementDailyUsage(db, batch, { userId: uid, date: todayDateKey(), examSecondsDelta });

  await batch.commit();

  return { correct: correctCount, total: session.questionIds.length };
}

// Section 5.3: freely overwritable draft save — unlike tutor mode's submitAnswer, an exam answer
// isn't locked in or scored until submission, so a student can change their mind before
// submitting. isCorrect is intentionally left null here (computed once, for real, at
// finalization) and userQuestionStats is not touched here at all.
export async function saveExamAnswer(
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
): Promise<SaveExamAnswerResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };
  const { uid } = current;

  const db = getAdminDb();
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) return { error: 'Session not found.' };

  const session = sessionSnap.data() as SessionDoc;
  if (session.userId !== uid) return { error: 'Not your session.' };
  if (session.mode !== 'timed_exam') return { error: 'Not a timed exam session.' };
  if (!session.questionIds.includes(questionId)) {
    return { error: 'That question is not part of this session.' };
  }

  if (session.completedAt !== null) return { status: 'expired' };

  // Never trust the client's own clock for whether time is up — recheck server-side. If the
  // deadline has already passed (the browser's timer hasn't auto-submitted yet, e.g. it just
  // reconnected), finalize now rather than accept a late answer change.
  const remaining = computeRemainingSeconds(session.startedAt.toMillis(), session.durationSeconds ?? 0, Date.now());
  if (remaining <= 0) {
    await finalizeExam(db, sessionRef, session, uid);
    return { status: 'expired' };
  }

  // Section 7.2: questionsAnswered counts distinct questions answered, in either mode — only on
  // the first save for this question, not on every revision (exam answers are freely
  // overwritable, unlike tutor mode's locked-in submitAnswer), so changing your mind doesn't
  // inflate the count.
  const isNewAnswer = session.answers[questionId]?.selectedOptionId == null;

  const batch = db.batch();
  batch.update(sessionRef, {
    [`answers.${questionId}`]: {
      selectedOptionId,
      isCorrect: null,
      flaggedForReview: session.answers[questionId]?.flaggedForReview ?? false,
      timeSpentSeconds: 0,
    },
  });
  if (isNewAnswer) {
    incrementDailyUsage(db, batch, { userId: uid, date: todayDateKey(), questionsAnsweredDelta: 1 });
  }
  await batch.commit();

  return { status: 'saved' };
}

// Explicit "Submit exam" click, or the client-side countdown reaching zero. Idempotent — a
// double-click or a submit-vs-auto-submit race both just return the already-computed score.
export async function submitExam(sessionId: string): Promise<SubmitExamResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };
  const { uid } = current;

  const db = getAdminDb();
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) return { error: 'Session not found.' };

  const session = sessionSnap.data() as SessionDoc;
  if (session.userId !== uid) return { error: 'Not your session.' };
  if (session.mode !== 'timed_exam') return { error: 'Not a timed exam session.' };

  if (session.completedAt !== null) {
    return { correct: session.score?.correct ?? 0, total: session.questionIds.length };
  }

  return finalizeExam(db, sessionRef, session, uid);
}
