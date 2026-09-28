import { notFound, redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { PracticeSession } from '@/components/quiz/PracticeSession';
import type { QuestionDoc, SessionDoc } from '@/types';

// Server-renders the session + every question doc upfront (Section 8 NFR: "Server-render
// question data") rather than a client-side fetch waterfall — a session is at most 100
// questions (Section 6.6's daily cap), small enough to load in one round trip.
export default async function PracticeSessionPage({ params }: { params: { sessionId: string } }) {
  const current = await getCurrentProfile();
  if (!current) redirect('/sign-in');

  const db = getAdminDb();
  const sessionSnap = await db.collection('sessions').doc(params.sessionId).get();
  if (!sessionSnap.exists) notFound();

  const session = sessionSnap.data() as SessionDoc;
  // 404 rather than a permissions error either way, so a guessed ID can't confirm another
  // user's session exists.
  if (session.userId !== current.uid) notFound();

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

  const initialAnswers = Object.fromEntries(
    Object.entries(session.answers).map(([questionId, answer]) => [
      questionId,
      { selectedOptionId: answer.selectedOptionId, isCorrect: answer.isCorrect },
    ]),
  );

  return (
    <PracticeSession
      sessionId={sessionSnap.id}
      questions={questions}
      initialAnswers={initialAnswers}
      initiallyCompleted={session.completedAt !== null}
    />
  );
}
