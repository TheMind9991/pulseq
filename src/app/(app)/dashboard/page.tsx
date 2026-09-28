import Link from 'next/link';
import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { StatCard } from '@/components/dashboard/StatCard';
import { TopicAccuracyTable, type TopicAccuracyRow } from '@/components/dashboard/TopicAccuracyTable';
import { SessionHistoryTable, type SessionHistoryRow } from '@/components/dashboard/SessionHistoryTable';
import { Button } from '@/components/ui/Button';
import type { SessionDoc, UserTopicStatsDoc } from '@/types';

// Section 5.4: server-rendered read of userTopicStats (sorted by accuracy ascending, so weak
// areas surface first — cheap single-collection reads per Section 3.5's design, no aggregation
// query here) and the 5 most recent sessions.
export default async function DashboardPage() {
  const current = await getCurrentProfile();
  if (!current) return null; // AppLayout already redirects unauthenticated/un-onboarded requests

  const { uid, profile } = current;
  const db = getAdminDb();

  const [topicStatsSnap, sessionsSnap] = await Promise.all([
    db.collection('userTopicStats').where('userId', '==', uid).orderBy('accuracy', 'asc').get(),
    db.collection('sessions').where('userId', '==', uid).orderBy('completedAt', 'desc').limit(5).get(),
  ]);

  const topicStats = topicStatsSnap.docs.map((doc) => doc.data() as UserTopicStatsDoc);
  const topicRows: TopicAccuracyRow[] = topicStats.map((t) => ({
    topic: t.topic,
    accuracy: t.accuracy,
    questionsAnswered: t.questionsAnswered,
    status: t.status,
  }));

  const totalQuestionsAnswered = topicStats.reduce((sum, t) => sum + t.questionsAnswered, 0);
  const overallAccuracy =
    totalQuestionsAnswered > 0
      ? topicStats.reduce((sum, t) => sum + t.questionsAnswered * t.accuracy, 0) / totalQuestionsAnswered
      : 0;
  const weakestTopic = topicStats[0]; // already sorted accuracy ascending

  // "Practise weak topics" (Section 5.4): every topic actually flagged 'weak', or — if the
  // student doesn't have one yet — the single lowest-accuracy topic as a reasonable fallback,
  // so the button still does something useful for a student who's just getting started.
  const weakTopics = topicStats.filter((t) => t.status === 'weak').map((t) => t.topic);
  const practiseWeakTopics = weakTopics.length > 0 ? weakTopics : weakestTopic ? [weakestTopic.topic] : [];
  const practiseWeakTopicsHref = (() => {
    if (practiseWeakTopics.length === 0) return null;
    const params = new URLSearchParams();
    practiseWeakTopics.forEach((topic) => params.append('topic', topic));
    return `/practice?${params.toString()}`;
  })();

  const sessionRows: SessionHistoryRow[] = sessionsSnap.docs.map((doc) => {
    const session = doc.data() as SessionDoc;
    return {
      id: doc.id,
      mode: session.mode,
      startedAtLabel: session.startedAt.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      completed: session.completedAt !== null,
      score: session.score,
      questionCount: session.questionIds.length,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Welcome, {profile.displayName.split(' ')[0]}</h1>
          <p className="mt-2 text-secondary">
            {profile.faculty} &middot; Year {profile.academicYear}
          </p>
        </div>
        {practiseWeakTopicsHref && (
          <Link href={practiseWeakTopicsHref}>
            <Button>Practise weak topics</Button>
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Questions answered"
          value={String(totalQuestionsAnswered)}
          testId="stat-questions-answered"
        />
        <StatCard
          label="Overall accuracy"
          value={`${Math.round(overallAccuracy * 100)}%`}
          testId="stat-overall-accuracy"
        />
        <StatCard
          label="Weakest topic"
          value={weakestTopic ? weakestTopic.topic : '—'}
          hint={weakestTopic ? `${Math.round(weakestTopic.accuracy * 100)}% correct` : 'Start practising to see this'}
          testId="stat-weakest-topic"
        />
      </div>

      <div className="mt-8">
        <TopicAccuracyTable topics={topicRows} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-primary">Recent sessions</h2>
        <SessionHistoryTable sessions={sessionRows} />
      </div>
    </div>
  );
}
