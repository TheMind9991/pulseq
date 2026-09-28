import { notFound, redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { ExamSession } from '@/components/quiz/ExamSession';
import { ExamReview } from '@/components/quiz/ExamReview';
import type { QuestionDoc, SessionDoc } from '@/types';

// Section 5.3: server-renders the session + every question doc upfront, same reasoning as the
// practice session screen (Section 8 NFR). Branches on completedAt: the in-progress exam UI
// (ExamSession, feedbackMode="hidden") vs the post-submission review screen (ExamReview,
// feedbackMode="always") are different enough to be separate components rather than one with a
// lot of internal branching.
export default async function ExamSessionPage({ params }: { params: { sessionId: string } }) {
  const current = await getCurrentProfile();
  if (!current) redirect('/sign-in');

  const db = getAdminDb();
  const sessionSnap = await db.collection('sessions').doc(params.sessionId).get();
  if (!sessionSnap.exists) notFound();

  const session = sessionSnap.data() as SessionDoc;
  // 404 rather than a permissions error either way, so a guessed ID can't confirm another
  // user's session exists. Also 404 on a tutor-mode session id under this route.
  if (session.userId !== current.uid || session.mode !== 'timed_exam') notFound();

  const questionRefs = session.questionIds.map((id) => db.collection('questions').doc(id));
  const questionDocs = questionRefs.length > 0 ? await db.getAll(...questionRefs) : [];

  const questions = questionDocs
    .filter((doc) => doc.exists)
    .map((doc) => {
      const data = doc.data() as QuestionDoc;
      return {
        id: doc.id,
        stem: data.stem,
        options: data.options,
        correctOptionId: data.correctOptionId,
        correctExplanation: data.correctExplanation,
      };
    });

  if (session.completedAt !== null) {
    const answers = Object.fromEntries(
      Object.entries(session.answers).map(([questionId, answer]) => [
        questionId,
        { selectedOptionId: answer.selectedOptionId, isCorrect: answer.isCorrect },
      ]),
    );
    return (
      <ExamReview
        questions={questions}
        answers={answers}
        score={session.score ?? { correct: 0, total: session.questionIds.length }}
      />
    );
  }

  const initialAnswers = Object.fromEntries(
    Object.entries(session.answers).map(([questionId, answer]) => [
      questionId,
      { selectedOptionId: answer.selectedOptionId },
    ]),
  );

  return (
    <ExamSession
      sessionId={sessionSnap.id}
      questions={questions}
      initialAnswers={initialAnswers}
      startedAtMillis={session.startedAt.toMillis()}
      durationSeconds={session.durationSeconds ?? 0}
    />
  );
}
