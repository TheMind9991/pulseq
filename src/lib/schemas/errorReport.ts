import { z } from 'zod';

export const errorReportStatusSchema = z.enum(['open', 'resolved', 'dismissed']);
export type ErrorReportStatus = z.infer<typeof errorReportStatusSchema>;

export const createErrorReportSchema = z.object({
  questionId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(1000),
});
export type CreateErrorReportInput = z.infer<typeof createErrorReportSchema>;
