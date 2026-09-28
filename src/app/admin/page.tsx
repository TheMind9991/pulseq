import Link from 'next/link';
import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import type { QuestionDoc } from '@/types';

interface CoverageRow {
  subject: string;
  topic: string;
  published: number;
  inReview: number;
  draft: number;
  retired: number;
}

// Content coverage per subject/topic (Section 5.6's admin overview) — a quick read on where the
// question bank is thin. Fetches every question for the tenant and aggregates in application
// code rather than a Firestore aggregation query, same tradeoff as selectSessionQuestions (see
// DECISIONS.md): fine at this content volume, revisit if it grows much larger.
export default async function AdminOverviewPage() {
  const serverUser = await getServerUser();
  if (!serverUser?.tenantId) return null; // AdminLayout already redirects otherwise

  const db = getAdminDb();
  const snapshot = await db.collection('questions').where('tenantId', '==', serverUser.tenantId).get();
  const questions = snapshot.docs.map((doc) => doc.data() as QuestionDoc);

  const bySubjectTopic = new Map<string, CoverageRow>();
  for (const q of questions) {
    const key = `${q.subject}::${q.topic}`;
    const row = bySubjectTopic.get(key) ?? { subject: q.subject, topic: q.topic, published: 0, inReview: 0, draft: 0, retired: 0 };
    if (q.status === 'published') row.published++;
    else if (q.status === 'in_review') row.inReview++;
    else if (q.status === 'draft') row.draft++;
    else if (q.status === 'retired') row.retired++;
    bySubjectTopic.set(key, row);
  }
  const rows = [...bySubjectTopic.values()].sort(
    (a, b) => a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic),
  );

  const totals = questions.reduce(
    (acc, q) => {
      acc.total++;
      if (q.status === 'published') acc.published++;
      if (q.status === 'in_review') acc.inReview++;
      return acc;
    },
    { total: 0, published: 0, inReview: 0 },
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-primary">Overview</h1>
      <p className="mb-6 text-sm text-secondary">
        {totals.total} question(s) total &middot; {totals.published} published &middot; {totals.inReview} awaiting
        review.
      </p>

      {totals.inReview > 0 && (
        <Link
          href="/admin/questions?status=in_review"
          className="mb-6 inline-block text-sm text-accent hover:underline"
        >
          Review {totals.inReview} question(s) in the queue →
        </Link>
      )}

      <div className="overflow-hidden rounded-lg border border-subtle bg-surface">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-muted">No content yet — start with Upload or New question.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle text-left text-secondary">
                <th scope="col" className="px-4 py-3 font-medium">
                  Subject
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Topic
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Published
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  In review
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Draft
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Retired
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.subject}::${row.topic}`} className="border-b border-subtle last:border-0">
                  <td className="px-4 py-3 text-primary">{row.subject}</td>
                  <td className="px-4 py-3 text-secondary">{row.topic}</td>
                  <td className="px-4 py-3 text-right text-primary">{row.published}</td>
                  <td className="px-4 py-3 text-right text-secondary">{row.inReview}</td>
                  <td className="px-4 py-3 text-right text-secondary">{row.draft}</td>
                  <td className="px-4 py-3 text-right text-muted">{row.retired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
