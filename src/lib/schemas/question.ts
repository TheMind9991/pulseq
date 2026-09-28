import { z } from 'zod';

export const optionIdSchema = z.enum(['A', 'B', 'C', 'D', 'E']);
export type OptionId = z.infer<typeof optionIdSchema>;

export const questionOptionSchema = z.object({
  id: optionIdSchema,
  text: z.string().trim().min(1),
  explanation: z.string().trim().optional(),
  textAr: z.string().trim().optional(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

export const questionDifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type QuestionDifficulty = z.infer<typeof questionDifficultySchema>;

export const questionStatusSchema = z.enum(['draft', 'in_review', 'published', 'retired']);
export type QuestionStatus = z.infer<typeof questionStatusSchema>;

// The content fields of a questions/{questionId} doc (Section 3.2) — everything except the
// server-assigned bookkeeping fields (authorId, reviewedById, createdAt, updatedAt, tenantId),
// which callers set separately. Shared by the (future, Phase 5) admin question editor and the
// bulk-upload row validator; the seed script also builds against this shape for consistency.
export const questionContentSchema = z
  .object({
    stem: z.string().trim().min(1),
    stemAr: z.string().trim().optional(),
    options: z.array(questionOptionSchema).min(2).max(5),
    correctOptionId: optionIdSchema,
    correctExplanation: z.string().trim().min(1),
    correctExplanationAr: z.string().trim().optional(),
    reference: z.string().trim().optional(),
    imageUrl: z.string().url().optional(),
    subject: z.string().trim().min(1),
    topic: z.string().trim().min(1),
    subtopic: z.string().trim().optional(),
    skillTag: z.string().trim().optional(),
    tagsRaw: z.string(),
    difficulty: questionDifficultySchema,
    examWeight: z.number().optional(),
    status: questionStatusSchema,
    sourceReviewed: z.boolean(),
    authorNote: z.string().trim().optional(),
  })
  .refine((q) => q.options.some((o) => o.id === q.correctOptionId), {
    message: 'correctOptionId must reference one of the populated options',
    path: ['correctOptionId'],
  });
export type QuestionContent = z.infer<typeof questionContentSchema>;
