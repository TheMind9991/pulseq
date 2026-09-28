import Link from 'next/link';
import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { Button } from '@/components/ui/Button';
import type { QuestionStatus } from '@/lib/schemas/question';
import type { QuestionDoc } from '@/types';

const STATUS_TABS: { value: QuestionStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'published', label: 'Published' },
  { value: 'retired', label: 'Retired' },
];

const STATUS_BADGE_CLASSES: Record<QuestionStatus, string> = {
  draft: 'bg-surface-hover text-secondary',
  in_review: 'bg-warning/15 text-warning',
  published: 'bg-success/15 text-success',
  retired: 'bg-surface-hover text-muted',
};

// The review queue (Section 5.6): filterable by status so editors can find drafts to submit and
// admins can find in_review questions waiting for someone other than the author to publish.
export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const serverUser = await getServerUser();
  if (!serverUser?.tenantId) return null; // AdminLayout already redirects otherwise

  const statusParam = searchParams.status;
  const activeStatus: QuestionStatus | 'all' =
    statusParam && STATUS_TABS.some((t) => t.value === statusParam) ? (statusParam as QuestionStatus | 'all') : 'all';

  const db = getAdminDb();
  let query = db.collection('questions').where('tenantId', '==', serverUser.tenantId).orderBy('createdAt', 'desc');
  if (activeStatus !== 'all') {
    query = db
      .collection('questions')
      .where('tenantId', '==', serverUser.tenantId)
      .where('status', '==', activeStatus)
      .orderBy('createdAt', 'desc');
  }
  const snapshot = await query.limit(100).get();
  const questions = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as QuestionDoc) }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Questions</h1>
        <Link href="/admin/questions/new">
          <Button>New question</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/admin/questions' : `/admin/questions?status=${tab.value}`}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              activeStatus === tab.value
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-subtle bg-surface text-secondary hover:bg-surface-hover'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-subtle bg-surface">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-muted">No questions match this filter yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle text-start text-secondary">
                <th scope="col" className="px-4 py-3 font-medium">
                  Stem
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Subject / Topic
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-subtle last:border-0">
                  <td className="max-w-md truncate px-4 py-3 text-primary">
                    <Link href={`/admin/questions/${q.id}`} className="hover:underline">
                      {q.stem}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {q.subject} &middot; {q.topic}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[q.status]}`}>
                      {q.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
