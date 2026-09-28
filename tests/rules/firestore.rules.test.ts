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
