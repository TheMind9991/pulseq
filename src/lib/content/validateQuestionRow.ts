import { extractAnswerLetter } from '@/lib/content/extractAnswerLetter';
import { parseTagsToTaxonomy } from '@/lib/content/parseTagsToTaxonomy';
import type { OptionId } from '@/lib/schemas/question';

// Raw values as read from the sheet — column names match the header row exactly (Section 5.5.1).
// xlsx gives numbers for numeric cells and booleans for checkbox-formatted cells, so these aren't
// all strings even though most are read as free text.
export interface RawQuestionRow {
  Question: unknown;
  Chapter: unknown;
  Score: unknown;
  OptionA_Text: unknown;
  OptionA_Explain: unknown;
  OptionB_Text: unknown;
  OptionB_Explain: unknown;
  OptionC_Text: unknown;
  OptionC_Explain: unknown;
  OptionD_Text: unknown;
  OptionD_Explain: unknown;
  OptionE_Text: unknown;
  OptionE_Explain: unknown;
  Answer: unknown;
  CorrectOption_Explanation: unknown;
  Tags: unknown;
  Reviewed: unknown;
  Comment: unknown;
}

const OPTION_IDS: OptionId[] = ['A', 'B', 'C', 'D', 'E'];

function str(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export type RowFlagCode =
  | 'too_few_options'
  | 'malformed_answer'
  | 'answer_not_populated'
  | 'missing_option_explanation'
  | 'missing_correct_explanation'
  | 'too_few_tag_segments'
  | 'has_comment';

export interface RowFlag {
  code: RowFlagCode;
  message: string;
  blocking: boolean;
}

export type RowSeverity = 'pass' | 'warning' | 'fail';

export interface ParsedOption {
  id: OptionId;
  text: string;
  explanation?: string;
}

// Always populated with whatever *was* extractable, pass or fail — Section 5.5.3 requires the
// preview report to show parsed subject/topic/subtopic/skillTag for every row, including failing
// ones (e.g. a row with only "Internal Medicine" in Tags still shows subject correctly, with the
// missing topic being exactly why it's flagged).
export interface RowValidationResult {
  rowNumber: number; // the actual spreadsheet row number (header = row 1), not a 0-indexed count
  severity: RowSeverity;
  flags: RowFlag[];
  stem: string;
  options: ParsedOption[];
  correctOptionId?: OptionId;
  correctExplanation: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  skillTag?: string;
  tagsRaw: string;
  chapter: string;
  examWeight?: number;
  sourceReviewed: boolean;
  authorNote?: string;
}

export function validateQuestionRow(row: RawQuestionRow, rowNumber: number): RowValidationResult {
  const flags: RowFlag[] = [];

  const stem = str(row.Question);

  const options: ParsedOption[] = OPTION_IDS.map((id) => ({
    id,
    text: str(row[`Option${id}_Text` as keyof RawQuestionRow]),
    explanation: str(row[`Option${id}_Explain` as keyof RawQuestionRow]) || undefined,
  })).filter((o) => o.text.length > 0);

  if (options.length < 2) {
    flags.push({
      code: 'too_few_options',
      message: `Only ${options.length} option(s) populated — at least 2 are required.`,
      blocking: true,
    });
  }

  const answerRaw = str(row.Answer);
  const answerResult = extractAnswerLetter(answerRaw);
  let correctOptionId: OptionId | undefined;
  if ('error' in answerResult) {
    // Truly ambiguous or empty — no letter to recover, so this genuinely can't be answered
    // without guessing (Section 5.5.1: "not silently defaulted to a guess").
    flags.push({
      code: 'malformed_answer',
      message: `Answer cell could not be parsed to a single A-E letter: "${answerRaw}"`,
      blocking: true,
    });
  } else {
    correctOptionId = answerResult.letter;
    if (!answerResult.wasClean) {
      // Not a bare letter, but the tolerant regex recovered exactly one unambiguous A-E from
      // surrounding text — surfaced for a human to double-check, not blocking (Section 5.5.1's
      // own worked example, "(A - selected as best clinical sign *among the options*)", is
      // exactly this case).
      flags.push({
        code: 'malformed_answer',
        message: `Answer cell wasn't a clean single letter; recovered "${correctOptionId}" from: "${answerRaw}"`,
        blocking: false,
      });
    }
    if (!options.some((o) => o.id === correctOptionId)) {
      flags.push({
        code: 'answer_not_populated',
        message: `Answer "${correctOptionId}" does not reference a populated option.`,
        blocking: true,
      });
    }
  }

  // Empty *_Explain is expected for the correct option (its rationale lives in
  // CorrectOption_Explanation instead) — only flag it for the OTHER options, and only as a
  // warning (Section 5.5.1).
  const missingExplanationIds = options.filter((o) => !o.explanation && o.id !== correctOptionId).map((o) => o.id);
  if (missingExplanationIds.length > 0) {
    flags.push({
      code: 'missing_option_explanation',
      message: `Missing explanation for option(s): ${missingExplanationIds.join(', ')}.`,
      blocking: false,
    });
  }

  const correctExplanation = str(row.CorrectOption_Explanation);
  if (!correctExplanation) {
    flags.push({
      code: 'missing_correct_explanation',
      message: 'CorrectOption_Explanation is empty.',
      blocking: true,
    });
  }

  const tagsRaw = str(row.Tags);
  const taxonomy = parseTagsToTaxonomy(tagsRaw);
  if (taxonomy.segmentCount < 2) {
    flags.push({
      code: 'too_few_tag_segments',
      message: `Tags has only ${taxonomy.segmentCount} segment(s) — at least subject and topic are required: "${tagsRaw}"`,
      blocking: true,
    });
  }

  const comment = str(row.Comment);
  if (comment) {
    flags.push({
      code: 'has_comment',
      message: `Author left a comment: "${comment}"`,
      blocking: false,
    });
  }

  const scoreRaw = row.Score;
  const examWeight = typeof scoreRaw === 'number' ? scoreRaw : Number(scoreRaw) || undefined;

  const reviewedRaw = row.Reviewed;
  const sourceReviewed = reviewedRaw === true || str(reviewedRaw).toLowerCase() === 'true';

  const blocking = flags.some((f) => f.blocking);
  const hasWarnings = flags.some((f) => !f.blocking);
  const severity: RowSeverity = blocking ? 'fail' : hasWarnings ? 'warning' : 'pass';

  return {
    rowNumber,
    severity,
    flags,
    stem,
    options,
    correctOptionId,
    correctExplanation,
    subject: taxonomy.subject,
    topic: taxonomy.topic,
    subtopic: taxonomy.subtopic,
    skillTag: taxonomy.skillTag,
    tagsRaw,
    chapter: str(row.Chapter),
    examWeight,
    sourceReviewed,
    authorNote: comment || undefined,
  };
}
