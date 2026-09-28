import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Section 7.4: "a scheduled Cloud Function... flips isPremium back to false when
// premiumExpiresAt passes without a renewal — at which point both ads and the daily caps resume
// applying." Runs daily; a renewal before expiry is just another successful webhook call that
// pushes premiumExpiresAt forward again, so this only ever catches genuinely lapsed
// subscriptions. No auto-recharge is attempted here — see DECISIONS.md for why silent
// card-token renewal was deferred rather than guessed at without a live sandbox to verify
// against.
export const expirePremium = onSchedule('every 24 hours', async () => {
  const db = getFirestore();
  const now = Timestamp.now();

  const snap = await db.collection('users').where('isPremium', '==', true).where('premiumExpiresAt', '<=', now).get();
  if (snap.empty) return;

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { isPremium: false }));
  await batch.commit();
});
