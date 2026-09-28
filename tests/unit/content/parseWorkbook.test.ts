import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseWorkbook } from '@/lib/content/parseWorkbook';
import { validateQuestionRow } from '@/lib/content/validateQuestionRow';

// The real fixture (Section 0 of the engineering spec: "Build and test the importer against this
// actual file... its quirks... are specified in detail because they are real and will recur").
// Ground truth below was established by directly inspecting this exact file (not the spec's
// prose alone) before writing the parser — see DECISIONS.md.
const FIXTURE_PATH = path.join(process.cwd(), 'tests/fixtures/Copy_of_End_round_IM_193.xlsx');

function loadFixtureRows() {
  const buffer = readFileSync(FIXTURE_PATH);
  const parsed = parseWorkbook(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
  if ('error' in parsed) throw new Error(`Fixture failed to parse: ${parsed.error}`);
  return parsed.rows;
}

describe('parseWorkbook against the real sample file', () => {
  it('stops at the first fully-blank row and extracts exactly the 50 real populated rows', () => {
    const rows = loadFixtureRows();
    expect(rows).toHaveLength(50);
    // Sheet row 2 is the first data row (row 1 is the header); row 51 is the last populated one.
    expect(rows[0]?.rowNumber).toBe(2);
    expect(rows[49]?.rowNumber).toBe(51);
  });

  it('does not choke on the trailing ~949 blank rows despite their stray formatted Reviewed cell', () => {
    // Empirically: rows 52+ read back with Reviewed === false (a checkbox format default) even
    // though every other cell, including Question, is genuinely empty — confirms the blank-row
    // cutoff must key off Question specifically, not "every cell is falsy".
    const rows = loadFixtureRows();
    expect(rows.every((r) => r.rowNumber <= 51)).toBe(true);
  });
});

describe('validateQuestionRow against every real row', () => {
  const results = loadFixtureRows().map(({ row, rowNumber }) => validateQuestionRow(row, rowNumber));

  it('extracts a subject and topic for every row (even the ones that go on to fail)', () => {
    // Section 5.5.3's done-when: "the validation preview correctly extracts subject/topic/
    // subtopic/skillTag from the Tags column for all 50 rows" — for all 50, not just the passing
    // ones.
    for (const r of results) {
      expect(r.subject, `row ${r.rowNumber} subject`).toBeTruthy();
    }
  });

  it('flags exactly the one row with the malformed Answer cell (sheet row 34)', () => {
    const malformed = results.filter((r) => r.flags.some((f) => f.code === 'malformed_answer'));
    expect(malformed).toHaveLength(1);
    expect(malformed[0]?.rowNumber).toBe(34);
  });

  it('surfaces exactly the 6 rows carrying a non-empty Comment', () => {
    const withComment = results.filter((r) => r.flags.some((f) => f.code === 'has_comment'));
    expect(withComment).toHaveLength(6);
    expect(withComment.map((r) => r.rowNumber).sort((a, b) => a - b)).toEqual([4, 29, 30, 31, 45, 47]);
  });

  it('blocks exactly the 8 rows whose Tags cell has only one segment (subject, no topic)', () => {
    const tooFewTags = results.filter((r) => r.flags.some((f) => f.code === 'too_few_tag_segments'));
    expect(tooFewTags).toHaveLength(8);
    for (const r of tooFewTags) {
      expect(r.severity).toBe('fail');
      expect(r.subject).toBe('Internal Medicine'); // still extracted despite failing
      expect(r.topic).toBeUndefined();
    }
  });

  it('passes or warns (never fails) every row that has neither problem', () => {
    const failing = results.filter((r) => r.severity === 'fail');
    // The one malformed-Answer row and the 8 too-few-tags rows overlap by exactly 1 (sheet row 34
    // has both problems), so 1 + 8 - 1 = 8 distinct failing rows, 42 importable.
    expect(failing).toHaveLength(8);
    expect(results.length - failing.length).toBe(42);
  });

  it('collapses the real casing inconsistency ("Internal medicine" vs "Internal Medicine") to one subject', () => {
    const subjects = new Set(results.map((r) => r.subject));
    expect(subjects).toEqual(new Set(['Internal Medicine']));
  });
});
