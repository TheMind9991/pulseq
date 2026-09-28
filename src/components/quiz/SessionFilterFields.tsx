'use client';

import { Chip } from '@/components/ui/Chip';
import { DIFFICULTY_LABELS, SUBJECTS } from '@/lib/constants/practice';
import type { SessionFiltersState } from '@/lib/sessions/useSessionFilters';

const DIFFICULTY_LEVELS = [1, 2, 3] as const;

// Subject/topic/difficulty/status chip fields shared by the practice and exam session builders.
export function SessionFilterFields({
  subjects,
  topics,
  difficulty,
  status,
  availableTopics,
  toggleSubject,
  toggleTopic,
  toggleDifficulty,
  setStatus,
}: SessionFiltersState) {
  return (
    <>
      <div>
        <h2 className="mb-2 text-sm font-medium text-secondary">Subject</h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <Chip
              key={subject}
              label={subject}
              selected={subjects.includes(subject)}
              onClick={() => toggleSubject(subject)}
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
              onClick={() => toggleTopic(topic)}
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
              onClick={() => toggleDifficulty(level)}
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
    </>
  );
}
