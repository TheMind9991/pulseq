import type { Timestamp } from 'firebase/firestore';
import type { Locale, UserRole } from '@/lib/schemas/user';
import type { QuestionContent } from '@/lib/schemas/question';
import type { SessionMode, SessionStatusFilter } from '@/lib/schemas/session';
import type { TopicStatus } from '@/lib/analytics/computeTopicAccuracy';
import type { ErrorReportStatus } from '@/lib/schemas/errorReport';

// users/{userId} — engineering spec Section 3.1.
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  tenantId: string;
  faculty: string;
  academicYear: number;
  modules: string[];
  isPremium: boolean;
  premiumExpiresAt: Timestamp | null;
  locale: Locale;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

// questions/{questionId} — Section 3.2. QuestionContent (schemas/question.ts) covers everything
// except these server-assigned bookkeeping fields.
export interface QuestionDoc extends QuestionContent {
  tenantId: string;
  authorId: string;
  reviewedById?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// sessions/{sessionId} — Section 3.3.
export interface SessionAnswer {
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  flaggedForReview: boolean;
  timeSpentSeconds: number;
}

export interface SessionFilters {
  subjects?: string[];
  topics?: string[];
  difficulty?: number[];
  status?: SessionStatusFilter;
}

export interface SessionDoc {
  tenantId: string;
  userId: string;
  mode: SessionMode;
  questionIds: string[];
  answers: Record<string, SessionAnswer>;
  filters: SessionFilters;
  durationSeconds?: number;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  score?: { correct: number; total: number };
}

// userQuestionStats/{userId}_{questionId} — Section 3.4.
export interface UserQuestionStatsDoc {
  userId: string;
  questionId: string;
  subject: string;
  topic: string;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: Timestamp;
  bookmarked: boolean;
}

// userTopicStats/{userId}_{topic} — Section 3.5.
export interface UserTopicStatsDoc {
  userId: string;
  subject: string;
  topic: string;
  questionsAnswered: number;
  accuracy: number;
  status: TopicStatus;
  updatedAt: Timestamp;
}

// errorReports/{reportId} — "Report an issue" affordance on QuestionCard (practice + exam
// review), surfaced to editors/admins via /admin/reports.
export interface ErrorReportDoc {
  questionId: string;
  tenantId: string;
  reportedByUserId: string;
  reason: string;
  status: ErrorReportStatus;
  createdAt: Timestamp;
  resolvedByUserId?: string;
  resolvedAt?: Timestamp | null;
}

// dailyUsage/{userId}_{yyyy-mm-dd} — Section 7.2. UTC calendar day boundary (see DECISIONS.md).
// Written only by the trusted server paths that also persist answers (submitAnswer,
// saveExamAnswer, finalizeExam) — firestore.rules denies every client write outright.
export interface DailyUsageDoc {
  userId: string;
  date: string;
  questionsAnswered: number;
  examSeconds: number;
  updatedAt: Timestamp;
}

// tenants/{tenantId} — Section 3.7, white-label scaffolding. Auto-provisioned with defaults by
// functions/src/auth/setCustomClaims.ts the first time any user's tenantId claim points at it —
// see DECISIONS.md for why creating a tenant is deliberately not a separate admin action.
export interface TenantDoc {
  name: string;
  domain?: string;
  branding: { logoUrl?: string; primaryColor?: string };
  createdAt: Timestamp;
}

export const DEFAULT_TENANT_ID = 'pulseq-core';
export const DAILY_QUESTION_CAP = 100;
export const DAILY_EXAM_SECONDS_CAP = 3600;
