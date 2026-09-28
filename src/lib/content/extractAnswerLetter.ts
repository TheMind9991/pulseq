import type { OptionId } from '@/lib/schemas/question';

// `wasClean: false` means the cell didn't match a bare single letter but the tolerant fallback
// recovered an unambiguous one anyway (the real sheet's example row) — validateQuestionRow turns
// that into a non-blocking warning, not a failure. A true `error` (no letter, or more than one
// distinct standalone letter) is the only case Section 5.5.1 means by "ambiguous or fails... must
// be rejected... not silently defaulted to a guess" — because there genuinely isn't one to pick.
export type AnswerExtractionResult =
  | { letter: OptionId; wasClean: boolean }
  | { error: string; raw: string };

// Section 5.5.1: "Answer is not always a clean single letter... The parser must extract a single
// leading A–E letter from this field with a tolerant regex (e.g. first standalone [A-E]
// character)."
//
// Real example from the sheet: "(A - selected as best clinical sign *among the options*)" — the
// clean-letter check below doesn't match, so it falls through to the tolerant \b[A-E]\b scan,
// which finds exactly one standalone "A" among the surrounding prose and recovers it (wasClean:
// false).
export function extractAnswerLetter(raw: string): AnswerExtractionResult {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();

  if (/^[A-E]$/.test(upper)) {
    return { letter: upper as OptionId, wasClean: true };
  }

  const matches = upper.match(/\b[A-E]\b/g);
  const distinct = matches ? new Set(matches) : new Set<string>();
  if (distinct.size === 1) {
    return { letter: [...distinct][0] as OptionId, wasClean: false };
  }

  return { error: 'Could not determine a single answer letter (A-E) from this cell.', raw };
}
