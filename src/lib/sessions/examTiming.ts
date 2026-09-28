// Pure, framework-agnostic — used both server-side (expiry checks in exams/[sessionId]/actions.ts)
// and client-side (ExamCountdown's ticking display). Section 5.3: "a visible countdown timer
// runs client-side (synced against startedAt + durationSeconds server timestamp so refreshing
// doesn't reset it)".
export function computeRemainingSeconds(
  startedAtMillis: number,
  durationSeconds: number,
  nowMillis: number,
): number {
  const elapsedSeconds = Math.floor((nowMillis - startedAtMillis) / 1000);
  return Math.max(0, durationSeconds - elapsedSeconds);
}

export function formatCountdown(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
