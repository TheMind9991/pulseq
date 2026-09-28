import type { QuestionContent } from '@/lib/schemas/question';
import type { RowValidationResult } from '@/lib/content/validateQuestionRow';

// Section 3.2: difficulty isn't present in the source sheets (Score is exam weight, not
// difficulty) — every imported question defaults to medium; editors adjust manually post-import.
const DEFAULT_IMPORTED_DIFFICULTY = 2 as const;

// Builds the actual Firestore write payload for a row the admin has chosen to import. Returns
// null for anything that isn't a clean pass/warning with a fully resolved answer+taxonomy —
// confirmBulkUpload never imports a failing row even if a caller forgets to filter one out.
export function toQuestionContent(result: RowValidationResult): QuestionContent | null {
  if (result.severity === 'fail') return null;
  if (!result.correctOptionId || !result.subject || !result.topic) return null;

  return {
    stem: result.stem,
    options: result.options,
    correctOptionId: result.correctOptionId,
    correctExplanation: result.correctExplanation,
    subject: result.subject,
    topic: result.topic,
    subtopic: result.subtopic,
    skillTag: result.skillTag,
    tagsRaw: result.tagsRaw,
    difficulty: DEFAULT_IMPORTED_DIFFICULTY,
    examWeight: result.examWeight,
    // Section 5.5.3 step 5: always draft on import, regardless of the sheet's own Reviewed value
    // — a second admin must move it through in_review to published.
    status: 'draft',
    sourceReviewed: result.sourceReviewed,
    authorNote: result.authorNote,
  };
}
