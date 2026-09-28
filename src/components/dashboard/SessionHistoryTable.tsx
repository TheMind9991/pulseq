import Link from 'next/link';

export interface SessionHistoryRow {
  id: string;
  mode: 'tutor' | 'timed_exam';
  startedAtLabel: string;
  completed: boolean;
  score?: { correct: number; total: number };
  questionCount: number;
}

const MODE_LABEL: Record<SessionHistoryRow['mode'], string> = {
  tutor: 'Practice',
  timed_exam: 'Timed exam',
};

export function SessionHistoryTable({ sessions }: { sessions: SessionHistoryRow[] }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-subtle p-8 text-center text-muted">
        Your recent sessions will show up here once you start practising.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-subtle text-start text-secondary">
            <th scope="col" className="px-4 py-3 font-medium">
              Mode
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Date
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-end font-medium">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-subtle last:border-0">
              <td className="px-4 py-3 text-primary">{MODE_LABEL[session.mode]}</td>
              <td className="px-4 py-3 text-secondary">{session.startedAtLabel}</td>
              <td className="px-4 py-3">
                {session.completed ? (
                  <span className="text-secondary">Completed</span>
                ) : (
                  <Link href={`/practice/${session.id}`} className="text-accent hover:underline">
                    Resume
                  </Link>
                )}
              </td>
              <td className="px-4 py-3 text-end text-primary">
                {session.score ? `${session.score.correct} / ${session.score.total}` : `— / ${session.questionCount}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
