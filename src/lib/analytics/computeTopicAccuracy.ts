// Pure aggregation logic for userTopicStats (Section 3.5), shared by the dashboard's display
// code and — as a duplicated copy, since functions/ is a separate TypeScript package with no
// access to src/ — functions/src/analytics/recomputeTopicStats.ts. Keep the two in sync; see
// DECISIONS.md.

export type TopicStatus = 'strong' | 'watch' | 'weak';

export const STRONG_THRESHOLD = 0.75;
export const WATCH_THRESHOLD = 0.5;

export function computeAccuracy(timesCorrect: number, timesSeen: number): number {
  if (timesSeen <= 0) return 0;
  return timesCorrect / timesSeen;
}

// >=75% strong, 50-74% watch, <50% weak (Section 3.5).
export function computeTopicStatus(accuracy: number): TopicStatus {
  if (accuracy >= STRONG_THRESHOLD) return 'strong';
  if (accuracy >= WATCH_THRESHOLD) return 'watch';
  return 'weak';
}

export interface QuestionStatsForAggregation {
  timesSeen: number;
  timesCorrect: number;
}

export interface TopicAggregate {
  questionsAnswered: number;
  accuracy: number;
  status: TopicStatus;
}

// Aggregates every userQuestionStats doc for one (user, topic) pair into the shape stored at
// userTopicStats/{userId}_{topic}. questionsAnswered counts distinct questions attempted at
// least once; accuracy is correct/seen across all attempts (not just first-attempt).
export function aggregateTopicStats(stats: QuestionStatsForAggregation[]): TopicAggregate {
  let questionsAnswered = 0;
  let totalSeen = 0;
  let totalCorrect = 0;

  for (const s of stats) {
    if (s.timesSeen > 0) {
      questionsAnswered += 1;
      totalSeen += s.timesSeen;
      totalCorrect += s.timesCorrect;
    }
  }

  const accuracy = computeAccuracy(totalCorrect, totalSeen);
  return { questionsAnswered, accuracy, status: computeTopicStatus(accuracy) };
}
