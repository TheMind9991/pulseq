import { useMemo, useState } from 'react';
import { SUBJECTS, SUBJECT_TOPICS } from '@/lib/constants/practice';
import { toggle } from '@/lib/utils';
import type { SessionStatusFilter } from '@/lib/schemas/session';

// 'flagged' depends on bookmarking, which has no UI yet (see DECISIONS.md) — the builder only
// ever offers Unseen/Incorrect/Any.
export type BuilderStatusFilter = Exclude<SessionStatusFilter, 'flagged'> | undefined;

// Shared subject/topic/difficulty/status filter state for both the practice and exam session
// builders (Section 5.2 step 1 / 5.3 "Same flow as 5.2 but...").
function subjectsForTopics(topics: string[]): string[] {
  const subjectSet = new Set<string>();
  for (const topic of topics) {
    for (const [subject, topicsForSubject] of Object.entries(SUBJECT_TOPICS)) {
      if ((topicsForSubject as readonly string[]).includes(topic)) subjectSet.add(subject);
    }
  }
  return Array.from(subjectSet);
}

export function useSessionFilters(initial?: { subjects?: string[]; topics?: string[] }) {
  const initialTopics = initial?.topics ?? [];
  // If topics are pre-filled (e.g. the dashboard's "Practise weak topics" button) but subjects
  // aren't given explicitly, derive them so the subject chips reflect the selection too.
  const [subjects, setSubjectsState] = useState<string[]>(initial?.subjects ?? subjectsForTopics(initialTopics));
  const [topics, setTopics] = useState<string[]>(initialTopics);
  const [difficulty, setDifficulty] = useState<(1 | 2 | 3)[]>([]);
  const [status, setStatus] = useState<BuilderStatusFilter>(undefined);

  const availableTopics = useMemo(() => {
    const subjectsToShow = subjects.length > 0 ? subjects : SUBJECTS;
    const topicSet = new Set<string>();
    subjectsToShow.forEach((s) => SUBJECT_TOPICS[s]?.forEach((t) => topicSet.add(t)));
    return Array.from(topicSet);
  }, [subjects]);

  function toggleSubject(subject: string) {
    const next = toggle(subjects, subject);
    setSubjectsState(next);
    // Drop any selected topics that no longer belong to the selected subjects.
    const stillValid = new Set((next.length > 0 ? next : SUBJECTS).flatMap((s) => SUBJECT_TOPICS[s] ?? []));
    setTopics((prev) => prev.filter((t) => stillValid.has(t)));
  }

  function toggleTopic(topic: string) {
    setTopics((prev) => toggle(prev, topic));
  }

  function toggleDifficulty(level: 1 | 2 | 3) {
    setDifficulty((prev) => toggle(prev, level));
  }

  return {
    subjects,
    topics,
    difficulty,
    status,
    availableTopics,
    toggleSubject,
    toggleTopic,
    toggleDifficulty,
    setStatus,
  };
}

export type SessionFiltersState = ReturnType<typeof useSessionFilters>;
