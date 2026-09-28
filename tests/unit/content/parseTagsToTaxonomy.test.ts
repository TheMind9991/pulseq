import { describe, expect, it } from 'vitest';
import { parseTagsToTaxonomy } from '@/lib/content/parseTagsToTaxonomy';

describe('parseTagsToTaxonomy', () => {
  it('maps 4 segments to subject/topic/subtopic/skillTag', () => {
    const result = parseTagsToTaxonomy('Internal Medicine, Cardiology, Hypertension, Management of hypertension');
    expect(result).toEqual({
      subject: 'Internal Medicine',
      topic: 'Cardiology',
      subtopic: 'Hypertension',
      skillTag: 'Management of hypertension',
      segmentCount: 4,
    });
  });

  it('joins a 5th+ segment onto skillTag with an em dash rather than discarding it', () => {
    const result = parseTagsToTaxonomy('Internal Medicine, Cardiology, Hypertension, Management, Follow-up');
    expect(result.skillTag).toBe('Management — Follow-up');
    expect(result.segmentCount).toBe(5);
  });

  it('leaves subtopic/skillTag undefined when only subject+topic are present', () => {
    const result = parseTagsToTaxonomy('Internal Medicine, Cardiology');
    expect(result.subtopic).toBeUndefined();
    expect(result.skillTag).toBeUndefined();
    expect(result.segmentCount).toBe(2);
  });

  it('reports segmentCount 1 (blocking) but still extracts the subject that is present', () => {
    const result = parseTagsToTaxonomy('Internal Medicine');
    expect(result.segmentCount).toBe(1);
    expect(result.subject).toBe('Internal Medicine');
    expect(result.topic).toBeUndefined();
  });

  it('reports segmentCount 0 for an empty cell', () => {
    const result = parseTagsToTaxonomy('');
    expect(result.segmentCount).toBe(0);
    expect(result.subject).toBeUndefined();
  });

  it('trims whitespace around each comma-separated segment', () => {
    const result = parseTagsToTaxonomy('  Internal Medicine ,  Cardiology  ');
    expect(result.subject).toBe('Internal Medicine');
    expect(result.topic).toBe('Cardiology');
  });

  it('collapses casing variants of the same subject to one canonical form', () => {
    const a = parseTagsToTaxonomy('Internal medicine, Cardiology');
    const b = parseTagsToTaxonomy('Internal Medicine, Cardiology');
    expect(a.subject).toBe(b.subject);
    expect(a.subject).toBe('Internal Medicine');
  });

  it('preserves an all-caps acronym topic instead of mangling it via naive title-case', () => {
    // Real value from the sample sheet: "GIT" (Gastrointestinal Tract) must not become "Git".
    const result = parseTagsToTaxonomy('Internal Medicine, GIT, Inflammatory bowel diseases');
    expect(result.topic).toBe('GIT');
  });

  it('ignores an empty segment from a stray double comma rather than shifting positions', () => {
    const result = parseTagsToTaxonomy('Internal Medicine,, Cardiology');
    expect(result.subject).toBe('Internal Medicine');
    expect(result.topic).toBe('Cardiology');
    expect(result.segmentCount).toBe(2);
  });
});
