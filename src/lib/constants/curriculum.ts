// Hardcoded reference lists for v1 onboarding (engineering spec 5.1: "a modules reference
// collection or hardcoded list for v1" — hardcoded chosen, see DECISIONS.md). Replace with a
// Firestore-backed `modules` collection once faculties beyond Kasr Al Ainy need customization.

export const FACULTIES = [
  'Faculty of Medicine, Cairo University (Kasr Al Ainy)',
  'Faculty of Medicine, Ain Shams University',
  'Faculty of Medicine, Alexandria University',
  'Newgiza University, Faculty of Medicine',
  'Other',
] as const;

export const ACADEMIC_YEARS = [1, 2, 3, 4, 5, 6] as const;

export const MODULES = [
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pharmacology',
  'Pathology',
  'Microbiology',
  'Internal Medicine',
  'Surgery',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Community Medicine',
] as const;
