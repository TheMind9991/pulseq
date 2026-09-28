import { getCurrentProfile } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { getDailyUsage, todayDateKey } from '@/lib/usage/dailyUsage';
import { UpgradeButton } from '@/components/app/UpgradeButton';
import { CancelPremiumButton } from '@/components/app/CancelPremiumButton';
import { DAILY_EXAM_SECONDS_CAP, DAILY_QUESTION_CAP } from '@/types';

// Section 7.4: usage-against-caps for a free user (so they always know where they stand before
// hitting the wall), and the upgrade/cancel affordance either way.
export default async function SettingsPage() {
  const current = await getCurrentProfile();
  if (!current) return null; // AppLayout already redirects unauthenticated/un-onboarded requests

  const { profile } = current;
  const usage = await getDailyUsage(getAdminDb(), current.uid, todayDateKey());
  const examMinutesUsed = Math.floor(usage.examSeconds / 60);
  const examMinutesCap = Math.floor(DAILY_EXAM_SECONDS_CAP / 60);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-primary">Settings</h1>

      <div className="mt-8 rounded-lg border border-subtle bg-surface p-6">
        {profile.isPremium ? (
          <>
            <p className="text-sm font-medium text-success">PulseQ Unlimited</p>
            <p className="mt-1 text-sm text-secondary">
              {profile.premiumExpiresAt
                ? `Unlimited until ${profile.premiumExpiresAt.toDate().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}.`
                : 'Unlimited — no expiry on record.'}{' '}
              No ads, no daily limits.
            </p>
            <div className="mt-4">
              <CancelPremiumButton />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-primary">Free plan</p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm text-secondary">
                  <span>Questions today</span>
                  <span data-testid="usage-questions">
                    {usage.questionsAnswered} / {DAILY_QUESTION_CAP}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.min(100, (usage.questionsAnswered / DAILY_QUESTION_CAP) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-secondary">
                  <span>Exam-mode minutes today</span>
                  <span data-testid="usage-exam-minutes">
                    {examMinutesUsed} / {examMinutesCap}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.min(100, (usage.examSeconds / DAILY_EXAM_SECONDS_CAP) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-secondary">
              Upgrade to remove ads and daily limits entirely.
            </p>
            <div className="mt-4">
              <UpgradeButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
