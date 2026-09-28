'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { startPracticeSession } from '@/app/(app)/practice/actions';
import {
  DEFAULT_QUESTION_COUNT,
  DIFFICULTY_LABELS,
  QUESTION_COUNT_OPTIONS,
  SUBJECTS,
  SUBJECT_TOPICS,
} from '@/lib/constants/practice';
import { Button } from '@/components/ui/Button';

type StatusFilter = 'unseen' | 'incorrect' | undefined;
const DIFFICULTY_LEVELS = [1, 2, 3] as const;

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        selected
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-subtle bg-surface text-secondary hover:bg-surface-hover'
      }`}
    >
      {label}
    </button>
  );
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function PracticeBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fills from the dashboard's "Practise weak topics" button (Section 5.4), e.g.
  // /practice?topic=Cardiology&topic=Endocrine. Subjects are derived from the topics so the
  // subject chips reflect the selection too, rather than leaving them unset.
  const initialTopics = useMemo(() => searchParams.getAll('topic'), [searchParams]);
  const initialSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    for (const topic of initialTopics) {
      for (const [subject, topicsForSubject] of Object.entries(SUBJECT_TOPICS)) {
        if ((topicsForSubject as readonly string[]).includes(topic)) subjectSet.add(subject);
      }
    }
    return Array.from(subjectSet);
  }, [initialTopics]);

  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [difficulty, setDifficulty] = useState<(1 | 2 | 3)[]>([]);
  const [status, setStatus] = useState<StatusFilter>(undefined);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const availableTopics = useMemo(() => {
    const subjectsToShow = subjects.length > 0 ? subjects : SUBJECTS;
    const topicSet = new Set<string>();
    subjectsToShow.forEach((s) => SUBJECT_TOPICS[s]?.forEach((t) => topicSet.add(t)));
    return Array.from(topicSet);
  }, [subjects]);

  async function onStart() {
    setError(null);
    setStarting(true);
    const result = await startPracticeSession({
      subjects: subjects.length > 0 ? subjects : undefined,
      topics: topics.length > 0 ? topics : undefined,
      difficulty: difficulty.length > 0 ? difficulty : undefined,
      status,
      questionCount,
    });
    if ('error' in result) {
      setError(result.error);
      setStarting(false);
      return;
    }
    router.push(`/practice/${result.sessionId}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-primary">Start a practice session</h1>
      <p className="mt-1 text-secondary">Untimed tutor mode — see the explanation after every answer.</p>

      <div className="mt-8 space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Subject</h2>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((subject) => (
              <Chip
                key={subject}
                label={subject}
                selected={subjects.includes(subject)}
                onClick={() => {
                  const next = toggle(subjects, subject);
                  setSubjects(next);
                  // Drop any selected topics that no longer belong to the selected subjects.
                  const stillValid = new Set(
                    (next.length > 0 ? next : SUBJECTS).flatMap((s) => SUBJECT_TOPICS[s] ?? []),
                  );
                  setTopics((prevTopics) => prevTopics.filter((t) => stillValid.has(t)));
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Topic</h2>
          <div className="flex flex-wrap gap-2">
            {availableTopics.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                selected={topics.includes(topic)}
                onClick={() => setTopics(toggle(topics, topic))}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Difficulty</h2>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <Chip
                key={level}
                label={DIFFICULTY_LABELS[level]}
                selected={difficulty.includes(level)}
                onClick={() => setDifficulty(toggle(difficulty, level))}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Status</h2>
          <div className="flex flex-wrap gap-2">
            <Chip label="Any" selected={status === undefined} onClick={() => setStatus(undefined)} />
            <Chip label="Unseen" selected={status === 'unseen'} onClick={() => setStatus('unseen')} />
            <Chip label="Incorrect" selected={status === 'incorrect'} onClick={() => setStatus('incorrect')} />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium text-secondary">Number of questions</h2>
          <div className="flex flex-wrap gap-2">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <Chip
                key={count}
                label={String(count)}
                selected={questionCount === count}
                onClick={() => setQuestionCount(count)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={onStart} disabled={starting}>
          {starting ? 'Starting…' : 'Start'}
        </Button>
      </div>
    </div>
  );
}
