// Subject → topic taxonomy used by both the practice session builder (filter chips) and the
// dev seed script. Firestore has no cheap "distinct" query, so — same reasoning as
// curriculum.ts's hardcoded FACULTIES/MODULES — this is a hardcoded v1 reference list rather
// than derived from a live query. Once real content exists (Phase 5 bulk upload), this should
// become a query over actually-published subjects/topics instead. See DECISIONS.md.
export const SUBJECT_TOPICS: Record<string, readonly string[]> = {
  'Internal Medicine': ['Cardiology', 'Endocrine', 'Hepatology', 'Chest'],
  Pharmacology: ['Autonomic Pharmacology', 'Antimicrobials', 'Cardiovascular Pharmacology'],
  Anatomy: ['Upper Limb', 'Thorax', 'Abdomen'],
  Pathology: ['Inflammation & Repair', 'Neoplasia', 'Hemodynamics'],
};

export const SUBJECTS = Object.keys(SUBJECT_TOPICS);

export const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
};

export const QUESTION_COUNT_OPTIONS = [5, 10, 20, 30, 50] as const;
export const DEFAULT_QUESTION_COUNT = 10;
