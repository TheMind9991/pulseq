// Section 5.5.2: split the Tags cell on commas, trim each segment, map positionally to the
// taxonomy. A row with fewer than 2 segments (no subject+topic) fails validation — callers check
// `segmentCount < 2`, this function still returns whatever *was* extractable so the validation
// preview can show partial results even for a failing row (Section 5.5.3: "the parsed subject/
// topic/subtopic/skillTag" is part of the report for every row, not just passing ones).
export interface ParsedTaxonomy {
  subject?: string;
  topic?: string;
  subtopic?: string;
  skillTag?: string;
  segmentCount: number;
}

// "Internal medicine" vs "Internal Medicine" (both seen in the real sheet) should collapse to one
// canonical subject for grouping — but a naive capitalize-every-word title-case would mangle a
// real topic value in the same sheet: "GIT" (Gastrointestinal Tract) would become "Git". Preserve
// any token that's already fully uppercase (2+ chars) as an acronym instead of re-casing it.
function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      if (word.length > 1 && word === word.toUpperCase()) return word;
      if (word.length === 0) return word;
      return word[0]!.toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function parseTagsToTaxonomy(tagsRaw: string): ParsedTaxonomy {
  const segments = tagsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const subject = segments[0] ? titleCase(segments[0]) : undefined;
  const topic = segments[1] ? titleCase(segments[1]) : undefined;
  const subtopic = segments[2] || undefined;
  // A 5th+ segment isn't discarded — appended to skillTag rather than dropped (Section 5.5.2).
  const skillTagParts = segments.slice(3);
  const skillTag = skillTagParts.length > 0 ? skillTagParts.join(' — ') : undefined;

  return { subject, topic, subtopic, skillTag, segmentCount: segments.length };
}
