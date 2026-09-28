import Link from 'next/link';
import { getServerUser } from '@/lib/auth/getServerUser';
import { getAdminDb } from '@/lib/firebase/admin';
import { ReportRowActions } from '@/components/admin/ReportRowActions';
import { resolveErrorReport, dismissErrorReport } from '@/app/admin/reports/actions';
import type { ErrorReportDoc, QuestionDoc } from '@/types';

// The open error-report queue: every "Report an issue" submission from a student, until an
// editor/admin resolves (fixed) or dismisses (not an issue) it.
export default async function AdminReportsPage() {
  const serverUser = await getServerUser();
  if (!serverUser?.tenantId) return null; // AdminLayout already redirects otherwise

  const db = getAdminDb();
  const snapshot = await db
    .collection('errorReports')
    .where('tenantId', '==', serverUser.tenantId)
    .where('status', '==', 'open')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ErrorReportDoc) }));

  const questionIds = [...new Set(reports.map((r) => r.questionId))];
  const questionDocs = await Promise.all(questionIds.map((id) => db.collection('questions').doc(id).get()));
  const questionsById = new Map(
    questionDocs.filter((d) => d.exists).map((d) => [d.id, d.data() as QuestionDoc]),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-primary">Error reports</h1>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-subtle p-8 text-center text-muted">
          No open reports — you&apos;re all caught up.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const question = questionsById.get(report.questionId);
            return (
              <div key={report.id} className="rounded-lg border border-subtle bg-surface p-4">
                <Link
                  href={`/admin/questions/${report.questionId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {question ? question.stem : `Question ${report.questionId} (not found)`}
                </Link>
                <p className="mt-2 text-sm text-secondary">{report.reason}</p>
                <p className="mt-1 text-xs text-muted">
                  Reported {report.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <div className="mt-3">
                  <ReportRowActions
                    onResolve={resolveErrorReport.bind(null, report.id)}
                    onDismiss={dismissErrorReport.bind(null, report.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
