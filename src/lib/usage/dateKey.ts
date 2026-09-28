// Pure and dependency-free (no 'server-only') so it's safely importable from anywhere, including
// tests, unlike the rest of src/lib/usage/dailyUsage.ts which touches firebase-admin.
//
// UTC calendar day, not Africa/Cairo local day — simpler to reason about with no DST edge cases,
// and a student near midnight seeing their cap reset a couple of hours early/late is a minor,
// rare inconvenience next to the complexity of a timezone-aware boundary (Section 7.2 explicitly
// allows either choice; see DECISIONS.md).
export function todayDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function dailyUsageDocId(userId: string, date: string): string {
  return `${userId}_${date}`;
}
