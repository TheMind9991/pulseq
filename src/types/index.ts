import type { Timestamp } from 'firebase/firestore';
import type { Locale, UserRole } from '@/lib/schemas/user';
import type { QuestionContent } from '@/lib/schemas/question';
import type { SessionMode, SessionStatusFilter } from '@/lib/schemas/session';

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

export const DEFAULT_TENANT_ID = 'pulseq-core';
