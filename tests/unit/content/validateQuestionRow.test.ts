import { describe, expect, it } from 'vitest';
import { validateQuestionRow, type RawQuestionRow } from '@/lib/content/validateQuestionRow';

function baseRow(overrides: Partial<RawQuestionRow> = {}): RawQuestionRow {
  return {
    Question: 'A 35-year-old woman presents with palpitations. What is the diagnosis?',
    Chapter: 'Internal Medicine',
    Score: 1,
    OptionA_Text: 'Congestive heart failure',
    OptionA_Explain: 'Incorrect. Explanation A.',
    OptionB_Text: 'Cardiac asthma',
    OptionB_Explain: '',
    OptionC_Text: 'Infective endocarditis',
    OptionC_Explain: 'Incorrect. Explanation C.',
    OptionD_Text: 'Pneumonia',
    OptionD_Explain: 'Incorrect. Explanation D.',
    OptionE_Text: '',
    OptionE_Explain: '',
    Answer: 'B',
    CorrectOption_Explanation: 'B is correct because of the classic presentation.',
    Tags: 'Internal Medicine, Cardiology, Heart failure, Diagnosis of cardiac asthma',
    Reviewed: true,
    Comment: '',
    ...overrides,
  };
}

describe('validateQuestionRow', () => {
  it('passes a clean row with the correct option explanation empty (expected, not a warning)', () => {
    const result = validateQuestionRow(baseRow(), 2);
    expect(result.severity).toBe('pass');
    expect(result.flags).toEqual([]);
    expect(result.correctOptionId).toBe('B');
    expect(result.subject).toBe('Internal Medicine');
    expect(result.topic).toBe('Cardiology');
    expect(result.subtopic).toBe('Heart failure');
    expect(result.skillTag).toBe('Diagnosis of cardiac asthma');
    expect(result.options).toHaveLength(4);
  });

  it('warns (not fails) on a missing explanation for a non-correct option', () => {
    const result = validateQuestionRow(baseRow({ OptionA_Explain: '' }), 2);
    expect(result.severity).toBe('warning');
    expect(result.flags.some((f) => f.code === 'missing_option_explanation' && !f.blocking)).toBe(true);
  });

  it('does not warn about the correct option itself lacking a per-option explanation', () => {
    // OptionB is the correct answer and already has no explanation in baseRow() — should not
    // itself trigger the warning (only non-correct options do).
    const result = validateQuestionRow(baseRow(), 2);
    expect(result.flags.some((f) => f.code === 'missing_option_explanation')).toBe(false);
  });

  it('warns (not fails) on a non-empty Comment and surfaces it as authorNote', () => {
    const result = validateQuestionRow(baseRow({ Comment: "don't know how to tag this" }), 2);
    expect(result.severity).toBe('warning');
    expect(result.flags.some((f) => f.code === 'has_comment' && !f.blocking)).toBe(true);
    expect(result.authorNote).toBe("don't know how to tag this");
  });

  it('warns (does not fail) on the real malformed-but-recoverable Answer cell, and still resolves the letter', () => {
    // The tolerant regex successfully recovers 'A' from this exact real value — Section 5.5.1's
    // own worked example — so this is a flagged warning for a human to double-check, not a
    // block: there IS an unambiguous answer here, just not in clean-letter form.
    const result = validateQuestionRow(
      baseRow({ Answer: '(A - selected as best clinical sign *among the options*)' }),
      34,
    );
    expect(result.severity).toBe('warning');
    const flag = result.flags.find((f) => f.code === 'malformed_answer');
    expect(flag?.blocking).toBe(false);
    expect(flag?.message).toContain('(A - selected as best clinical sign *among the options*)');
    expect(result.correctOptionId).toBe('A');
  });

  it('fails (blocking) a row whose Answer cell is truly ambiguous — no letter to recover', () => {
    const result = validateQuestionRow(baseRow({ Answer: 'A or B' }), 2);
    expect(result.severity).toBe('fail');
    const flag = result.flags.find((f) => f.code === 'malformed_answer');
    expect(flag?.blocking).toBe(true);
    expect(result.correctOptionId).toBeUndefined();
  });

  it('fails a row with fewer than 2 tag segments, but still reports the extracted subject', () => {
    const result = validateQuestionRow(baseRow({ Tags: 'Internal Medicine' }), 29);
    expect(result.severity).toBe('fail');
    expect(result.flags.some((f) => f.code === 'too_few_tag_segments' && f.blocking)).toBe(true);
    expect(result.subject).toBe('Internal Medicine');
    expect(result.topic).toBeUndefined();
  });

  it('fails a row whose Answer references an unpopulated option', () => {
    const result = validateQuestionRow(baseRow({ Answer: 'E' }), 2); // E is empty in baseRow()
    expect(result.severity).toBe('fail');
    expect(result.flags.some((f) => f.code === 'answer_not_populated')).toBe(true);
  });

  it('fails a row with fewer than 2 populated options', () => {
    const result = validateQuestionRow(
      baseRow({
        OptionB_Text: '',
        OptionB_Explain: '',
        OptionC_Text: '',
        OptionC_Explain: '',
        OptionD_Text: '',
        OptionD_Explain: '',
        Answer: 'A',
      }),
      2,
    );
    expect(result.severity).toBe('fail');
    expect(result.flags.some((f) => f.code === 'too_few_options')).toBe(true);
  });

  it('fails a row with an empty CorrectOption_Explanation', () => {
    const result = validateQuestionRow(baseRow({ CorrectOption_Explanation: '' }), 2);
    expect(result.severity).toBe('fail');
    expect(result.flags.some((f) => f.code === 'missing_correct_explanation')).toBe(true);
  });

  it('combines a warning and a blocking flag on the real worst-case row (malformed Answer + few tags)', () => {
    const result = validateQuestionRow(
      baseRow({ Answer: '(A - selected as best clinical sign *among the options*)', Tags: 'Internal Medicine' }),
      34,
    );
    // fails overall because of too_few_tag_segments alone — the recovered Answer doesn't block it.
    expect(result.severity).toBe('fail');
    expect(result.flags.filter((f) => f.blocking)).toHaveLength(1);
    expect(result.flags.find((f) => f.code === 'too_few_tag_segments')?.blocking).toBe(true);
    expect(result.flags.find((f) => f.code === 'malformed_answer')?.blocking).toBe(false);
  });

  it('reads sourceReviewed from a boolean true/false Reviewed cell', () => {
    expect(validateQuestionRow(baseRow({ Reviewed: true }), 2).sourceReviewed).toBe(true);
    expect(validateQuestionRow(baseRow({ Reviewed: false }), 2).sourceReviewed).toBe(false);
  });

  it("never lets a non-empty Comment or the source sheet's Reviewed flag alone downgrade a pass to fail", () => {
    const result = validateQuestionRow(baseRow({ Comment: 'b?', Reviewed: true }), 30);
    expect(result.severity).toBe('warning'); // warning from the comment, not a failure
  });
});
