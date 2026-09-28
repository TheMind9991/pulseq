'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { upsertUserQuestionStats } from '@/lib/sessions/userQuestionStats';
import type { QuestionDoc, SessionAnswer, SessionDoc } from '@/types';

type SubmitAnswerResult =
  | {
      isCorrect: boolean;
      correctOptionId: string;
      correctExplanation: string;
      completed: boolean;
    }
  | { error: string };

// Section 5.2 step 3. Authoritative: correctness is always computed here from
// questions/{id}.correctOptionId, never trusted from the client — see DECISIONS.md for why this
// (and userQuestionStats/sessions writes generally) goes through a server action rather than a
// direct client Firestore write, even though the rules would currently allow one.
export async function submitAnswer(
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
  timeSpentSeconds: number,
): Promise<SubmitAnswerResult> {
  const current = await getCurrentProfile();
  if (!current) return { error: 'You must be signed in.' };
  const { uid } = current;

  const db = getAdminDb();
  const sessionRef = db.collection('sessions').doc(sessionId);
  const questionRef = db.collection('questions').doc(questionId);

  const [sessionSnap, questionSnap] = await Promise.all([sessionRef.get(), questionRef.get()]);
  if (!sessionSnap.exists) return { error: 'Session not found.' };
  if (!questionSnap.exists) return { error: 'Question not found.' };

  const session = sessionSnap.data() as SessionDoc;
  const question = questionSnap.data() as QuestionDoc;

  if (session.userId !== uid) return { error: 'Not your session.' };
  if (!session.questionIds.includes(questionId)) {
    return { error: 'That question is not part of this session.' };
  }

  // Idempotent: an already-answered question returns its stored result instead of re-scoring —
  // protects against double submits / retried requests re-inflating userQuestionStats, and lets
  // the client safely resume an interrupted session (Product PRD 5: "resume without losing
  // progress") by replaying the same call.
  const existingAnswer = session.answers[questionId];
  if (existingAnswer?.selectedOptionId != null) {
    return {
      isCorrect: existingAnswer.isCorrect ?? false,
      correctOptionId: question.correctOptionId,
      correctExplanation: question.correctExplanation,
      completed: session.completedAt !== null,
    };
  }

  const isCorrect = selectedOptionId === question.correctOptionId;
  const answer: SessionAnswer = {
    selectedOptionId,
    isCorrect,
    flaggedForReview: existingAnswer?.flaggedForReview ?? false,
    timeSpentSeconds,
  };

  const updatedAnswers = { ...session.answers, [questionId]: answer };
  const allAnswered = session.questionIds.every((id) => updatedAnswers[id]?.selectedOptionId != null);

  const sessionUpdate: Record<string, unknown> = { [`answers.${questionId}`]: answer };
  if (allAnswered && session.completedAt === null) {
    const correctCount = session.questionIds.filter((id) => updatedAnswers[id]?.isCorrect === true).length;
    sessionUpdate.completedAt = FieldValue.serverTimestamp();
    sessionUpdate.score = { correct: correctCount, total: session.questionIds.length };
  }

  const batch = db.batch();
  batch.update(sessionRef, sessionUpdate);
  await upsertUserQuestionStats(db, batch, {
    uid,
    questionId,
    subject: question.subject,
    topic: question.topic,
    isCorrect,
  });
  await batch.commit();

  return {
    isCorrect,
    correctOptionId: question.correctOptionId,
    correctExplanation: question.correctExplanation,
    completed: allAnswered,
  };
}
