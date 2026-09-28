import { z } from 'zod';
import { questionDifficultySchema } from '@/lib/schemas/question';

export const sessionModeSchema = z.enum(['tutor', 'timed_exam']);
export type SessionMode = z.infer<typeof sessionModeSchema>;

// Matches sessions.filters.status (Section 3.3). The session builder UI only exposes
// 'unseen'/'incorrect' for now — 'flagged' depends on userQuestionStats.bookmarked, which has
// no UI to set yet (bookmarking isn't assigned to a build phase; see DECISIONS.md), so it's kept
// in the schema for fidelity but is unreachable from the builder until that lands.
export const sessionStatusFilterSchema = z.enum(['unseen', 'incorrect', 'flagged']);
export type SessionStatusFilter = z.infer<typeof sessionStatusFilterSchema>;

export const sessionBuilderSchema = z.object({
  subjects: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  difficulty: z.array(questionDifficultySchema).optional(),
  status: sessionStatusFilterSchema.optional(),
  questionCount: z.coerce.number().int().min(1).max(100),
});
export type SessionBuilderInput = z.infer<typeof sessionBuilderSchema>;
