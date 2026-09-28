import { describe, expect, it } from 'vitest';
import { extractAnswerLetter } from '@/lib/content/extractAnswerLetter';

describe('extractAnswerLetter', () => {
  it('accepts a clean single letter, marked wasClean', () => {
    expect(extractAnswerLetter('A')).toEqual({ letter: 'A', wasClean: true });
    expect(extractAnswerLetter(' D ')).toEqual({ letter: 'D', wasClean: true });
  });

  it('is case-insensitive on a clean single letter', () => {
    expect(extractAnswerLetter('b')).toEqual({ letter: 'B', wasClean: true });
  });

  it('recovers the single standalone letter from the real malformed sheet value, marked not wasClean', () => {
    // The actual value from the sample file, row 34.
    const result = extractAnswerLetter('(A - selected as best clinical sign *among the options*)');
    expect(result).toEqual({ letter: 'A', wasClean: false });
  });

  it('rejects a cell with two different standalone letters as ambiguous', () => {
    const result = extractAnswerLetter('A or B');
    expect('error' in result).toBe(true);
  });

  it('accepts (not wasClean) a cell where the same letter appears standalone more than once', () => {
    expect(extractAnswerLetter('A, definitely A')).toEqual({ letter: 'A', wasClean: false });
  });

  it('rejects an empty cell', () => {
    const result = extractAnswerLetter('');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.raw).toBe('');
  });

  it('rejects a cell with no A-E letter at all, and preserves the raw value for the report', () => {
    const result = extractAnswerLetter('none of the above');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.raw).toBe('none of the above');
  });

  it('does not false-positive on lowercase words that happen to contain a run of A-E letters', () => {
    // "cab" contains a/b but not as standalone uppercase tokens once case-folded; "a" and "b" are
    // not surrounded by non-word boundaries as single tokens here.
    const result = extractAnswerLetter('cab');
    expect('error' in result).toBe(true);
  });
});
