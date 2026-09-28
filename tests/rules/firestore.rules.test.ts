import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  type RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

// Phase 1 scope only (engineering spec Section 10, Phase 1 "Done when": "firestore.rules.test.ts
// passing for auth-related rules"). Coverage for questions/sessions/dailyUsage etc. is added
// once those collections exist, in the phases that build them (see DECISIONS.md).
//
// Note: each RulesTestContext's .firestore() must be called exactly once and the returned
// instance reused for every operation in that test — calling it again after the instance has
// already been used throws "Firestore has already been started" (a quirk of
// @firebase/rules-unit-testing re-invoking initializeFirestore on the same app each call).

let testEnv: RulesTestEnvironment;

const STUDENT_A = { uid: 'student-a', role: 'student', tenantId: 'pulseq-core' };
const STUDENT_B = { uid: 'student-b', role: 'student', tenantId: 'pulseq-core' };
const EDITOR_A = { uid: 'editor-a', role: 'editor', tenantId: 'pulseq-core' };
const EDITOR_B = { uid: 'editor-b', role: 'editor', tenantId: 'pulseq-core' };

function baseUserDoc(uid: string) {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: 'Test Student',
    faculty: 'Faculty of Medicine, Cairo University (Kasr Al Ainy)',
    academicYear: 3,
    modules: ['Internal Medicine'],
    tenantId: 'pulseq-core',
    locale: 'en',
    createdAt: new Date(),
    lastActiveAt: new Date(),
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'pulseq-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('users/{userId}', () => {
  it('denies all access to an unauthenticated caller', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('users').doc(STUDENT_A.uid).get());
    await assertFails(db.collection('users').doc(STUDENT_A.uid).set(baseUserDoc(STUDENT_A.uid)));
  });

  it('lets a user create their own doc without role/isPremium/premiumExpiresAt', async () => {
    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertSucceeds(db.collection('users').doc(STUDENT_A.uid).set(baseUserDoc(STUDENT_A.uid)));
  });

  it('rejects a self-create that includes a role field', async () => {
    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertFails(
      db.collection('users').doc(STUDENT_A.uid).set({ ...baseUserDoc(STUDENT_A.uid), role: 'admin' }),
    );
  });

  it('rejects a self-create that includes isPremium or premiumExpiresAt', async () => {
    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertFails(
      db.collection('users').doc(STUDENT_A.uid).set({ ...baseUserDoc(STUDENT_A.uid), isPremium: true }),
    );
    await assertFails(
      db
        .collection('users')
        .doc(STUDENT_A.uid)
        .set({ ...baseUserDoc(STUDENT_A.uid), premiumExpiresAt: new Date() }),
    );
  });

  it("lets a user read and update their own doc, but not another user's", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await adminDb.collection('users').doc(STUDENT_A.uid).set(baseUserDoc(STUDENT_A.uid));
      await adminDb.collection('users').doc(STUDENT_B.uid).set(baseUserDoc(STUDENT_B.uid));
    });

    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertSucceeds(db.collection('users').doc(STUDENT_A.uid).get());
    await assertSucceeds(
      db.collection('users').doc(STUDENT_A.uid).update({ lastActiveAt: new Date() }),
    );

    await assertFails(db.collection('users').doc(STUDENT_B.uid).get());
    await assertFails(
      db.collection('users').doc(STUDENT_B.uid).update({ lastActiveAt: new Date() }),
    );
  });

  it('rejects a client attempt to set its own isPremium field via update', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('users')
        .doc(STUDENT_A.uid)
        .set({ ...baseUserDoc(STUDENT_A.uid), role: 'student', isPremium: false, premiumExpiresAt: null });
    });

    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertFails(db.collection('users').doc(STUDENT_A.uid).update({ isPremium: true }));
  });

  it("rejects a client attempt to change its own role via update (can't self-promote to admin)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('users')
        .doc(STUDENT_A.uid)
        .set({ ...baseUserDoc(STUDENT_A.uid), role: 'student', isPremium: false, premiumExpiresAt: null });
    });

    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertFails(db.collection('users').doc(STUDENT_A.uid).update({ role: 'admin' }));
  });
});

function authed(user: { uid: string; role: string; tenantId: string }) {
  return testEnv.authenticatedContext(user.uid, { role: user.role, tenantId: user.tenantId }).firestore();
}

function baseQuestionDoc(overrides: Record<string, unknown> = {}) {
  return {
    stem: 'A 35-year-old woman presents with palpitations. What is the diagnosis?',
    options: [
      { id: 'A', text: 'Congestive heart failure' },
      { id: 'B', text: 'Cardiac asthma' },
    ],
    correctOptionId: 'B',
    correctExplanation: 'B is correct because of the classic presentation.',
    subject: 'Internal Medicine',
    topic: 'Cardiology',
    tagsRaw: 'Internal Medicine, Cardiology',
    difficulty: 2,
    status: 'draft',
    sourceReviewed: false,
    tenantId: 'pulseq-core',
    authorId: EDITOR_A.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('questions/{questionId}', () => {
  it('lets an editor create a draft question but rejects creating straight to in_review/published', async () => {
    const db = authed(EDITOR_A);
    await assertSucceeds(db.collection('questions').doc('q1').set(baseQuestionDoc()));
    await assertFails(db.collection('questions').doc('q2').set(baseQuestionDoc({ status: 'in_review' })));
    await assertFails(db.collection('questions').doc('q3').set(baseQuestionDoc({ status: 'published' })));
  });

  it('denies a student from creating or reading a non-published question', async () => {
    const student = authed(STUDENT_A);
    await assertFails(student.collection('questions').doc('q1').set(baseQuestionDoc()));

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('questions').doc('q1').set(baseQuestionDoc());
    });
    await assertFails(student.collection('questions').doc('q1').get());
  });

  it('lets a student read a published question in their own tenant but not another tenant', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.collection('questions').doc('q1').set(baseQuestionDoc({ status: 'published' }));
      await db
        .collection('questions')
        .doc('q2')
        .set(baseQuestionDoc({ status: 'published', tenantId: 'other-tenant' }));
    });

    const student = authed(STUDENT_A);
    await assertSucceeds(student.collection('questions').doc('q1').get());
    await assertFails(student.collection('questions').doc('q2').get());
  });

  it('blocks an editor from publishing their own question (self-review)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('questions')
        .doc('q1')
        .set(baseQuestionDoc({ status: 'in_review', authorId: EDITOR_A.uid }));
    });

    const author = authed(EDITOR_A);
    await assertFails(
      author
        .collection('questions')
        .doc('q1')
        .update({ status: 'published', reviewedById: EDITOR_A.uid }),
    );
  });

  it('lets a different editor publish a question that is in_review', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('questions')
        .doc('q1')
        .set(baseQuestionDoc({ status: 'in_review', authorId: EDITOR_A.uid }));
    });

    const reviewer = authed(EDITOR_B);
    await assertSucceeds(
      reviewer
        .collection('questions')
        .doc('q1')
        .update({ status: 'published', reviewedById: EDITOR_B.uid }),
    );
  });

  it('blocks publishing a question that is not currently in_review', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('questions')
        .doc('q1')
        .set(baseQuestionDoc({ status: 'draft', authorId: EDITOR_A.uid }));
    });

    const reviewer = authed(EDITOR_B);
    await assertFails(
      reviewer
        .collection('questions')
        .doc('q1')
        .update({ status: 'published', reviewedById: EDITOR_B.uid }),
    );
  });

  it('blocks a reviewer from publishing under someone else\'s uid as reviewedById', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('questions')
        .doc('q1')
        .set(baseQuestionDoc({ status: 'in_review', authorId: EDITOR_A.uid }));
    });

    const reviewer = authed(EDITOR_B);
    await assertFails(
      reviewer
        .collection('questions')
        .doc('q1')
        .update({ status: 'published', reviewedById: EDITOR_A.uid }),
    );
  });

  it('allows non-publishing updates (e.g. moving draft to in_review) by the author', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('questions')
        .doc('q1')
        .set(baseQuestionDoc({ status: 'draft', authorId: EDITOR_A.uid }));
    });

    const author = authed(EDITOR_A);
    await assertSucceeds(author.collection('questions').doc('q1').update({ status: 'in_review' }));
  });

  it('denies deleting a question outright (retire via status update instead)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('questions').doc('q1').set(baseQuestionDoc());
    });

    const editor = authed(EDITOR_A);
    await assertFails(editor.collection('questions').doc('q1').delete());
  });
});

describe('errorReports/{reportId}', () => {
  function baseReport(overrides: Record<string, unknown> = {}) {
    return {
      questionId: 'q1',
      tenantId: 'pulseq-core',
      reportedByUserId: STUDENT_A.uid,
      reason: 'The correct answer looks wrong.',
      status: 'open',
      createdAt: new Date(),
      ...overrides,
    };
  }

  it('lets a signed-in student create a report for themself in their own tenant', async () => {
    const student = authed(STUDENT_A);
    await assertSucceeds(student.collection('errorReports').doc('r1').set(baseReport()));
  });

  it("rejects a create where reportedByUserId isn't the caller, or the tenant doesn't match", async () => {
    const student = authed(STUDENT_A);
    await assertFails(
      student.collection('errorReports').doc('r1').set(baseReport({ reportedByUserId: STUDENT_B.uid })),
    );
    await assertFails(
      student.collection('errorReports').doc('r2').set(baseReport({ tenantId: 'other-tenant' })),
    );
  });

  it('denies a student from reading or updating reports (editor/admin only)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('errorReports').doc('r1').set(baseReport());
    });

    const student = authed(STUDENT_A);
    await assertFails(student.collection('errorReports').doc('r1').get());
    await assertFails(student.collection('errorReports').doc('r1').update({ status: 'resolved' }));
  });

  it('lets an editor in the same tenant read and resolve a report, but not one from another tenant', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.collection('errorReports').doc('r1').set(baseReport());
      await db.collection('errorReports').doc('r2').set(baseReport({ tenantId: 'other-tenant' }));
    });

    const editor = authed(EDITOR_A);
    await assertSucceeds(editor.collection('errorReports').doc('r1').get());
    await assertSucceeds(
      editor.collection('errorReports').doc('r1').update({ status: 'resolved', resolvedByUserId: EDITOR_A.uid }),
    );

    await assertFails(editor.collection('errorReports').doc('r2').get());
  });
});

describe('dailyUsage/{docId}', () => {
  it('lets the owning user read their own doc but never write it directly', async () => {
    const docId = `${STUDENT_A.uid}_2026-09-28`;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('dailyUsage')
        .doc(docId)
        .set({ userId: STUDENT_A.uid, date: '2026-09-28', questionsAnswered: 5, examSeconds: 0 });
    });

    const db = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertSucceeds(db.collection('dailyUsage').doc(docId).get());
    await assertFails(db.collection('dailyUsage').doc(docId).update({ questionsAnswered: 999 }));
    await assertFails(
      db
        .collection('dailyUsage')
        .doc(`${STUDENT_A.uid}_2026-09-29`)
        .set({ userId: STUDENT_A.uid, date: '2026-09-29', questionsAnswered: 0, examSeconds: 0 }),
    );
  });
});

describe('userTopicStats/{docId}', () => {
  const docId = `${STUDENT_A.uid}_Cardiology`;

  it('lets the owning user read their own doc but not another user\'s, and never write it', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('userTopicStats')
        .doc(docId)
        .set({
          userId: STUDENT_A.uid,
          subject: 'Internal Medicine',
          topic: 'Cardiology',
          questionsAnswered: 4,
          accuracy: 0.75,
          status: 'strong',
        });
    });

    const asStudentA = testEnv.authenticatedContext(STUDENT_A.uid).firestore();
    await assertSucceeds(asStudentA.collection('userTopicStats').doc(docId).get());
    await assertFails(asStudentA.collection('userTopicStats').doc(docId).update({ accuracy: 1 }));

    const asStudentB = testEnv.authenticatedContext(STUDENT_B.uid).firestore();
    await assertFails(asStudentB.collection('userTopicStats').doc(docId).get());
  });
});

describe('tenants/{tenantId}', () => {
  it('lets a signed-in user read their own tenant but not another tenant', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.collection('tenants').doc('pulseq-core').set({ name: 'PulseQ', branding: {}, createdAt: new Date() });
      await db.collection('tenants').doc('other-tenant').set({ name: 'Other', branding: {}, createdAt: new Date() });
    });

    const student = authed(STUDENT_A); // tenantId: 'pulseq-core'
    await assertSucceeds(student.collection('tenants').doc('pulseq-core').get());
    await assertFails(student.collection('tenants').doc('other-tenant').get());
  });

  it('denies an unauthenticated read', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('tenants').doc('pulseq-core').set({ name: 'PulseQ', branding: {}, createdAt: new Date() });
    });

    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('tenants').doc('pulseq-core').get());
  });

  it('denies every client write — tenants are Admin-SDK-only (auto-provisioned by setCustomClaims)', async () => {
    const student = authed(STUDENT_A);
    await assertFails(student.collection('tenants').doc('pulseq-core').set({ name: 'Hijacked', branding: {}, createdAt: new Date() }));

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('tenants').doc('pulseq-core').set({ name: 'PulseQ', branding: {}, createdAt: new Date() });
    });
    await assertFails(student.collection('tenants').doc('pulseq-core').update({ name: 'Hijacked' }));
  });
});
