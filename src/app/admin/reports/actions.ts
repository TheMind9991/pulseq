'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getServerUser } from '@/lib/auth/getServerUser';
import type { ErrorReportDoc } from '@/types';

type ActionResult = { ok: true } | { error: string };

async function requireEditor() {
  const serverUser = await getServerUser();
  if (!serverUser) return { ok: false as const, error: 'You must be signed in.' };
  if (serverUser.role !== 'editor' && serverUser.role !== 'admin') {
    return { ok: false as const, error: 'Only editors and admins can triage reports.' };
  }
  if (!serverUser.tenantId) return { ok: false as const, error: 'Missing tenant.' };
  return { ok: true as const, serverUser: { ...serverUser, tenantId: serverUser.tenantId } };
}

async function setReportStatus(reportId: string, status: 'resolved' | 'dismissed'): Promise<ActionResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const db = getAdminDb();
  const ref = db.collection('errorReports').doc(reportId);
  const snap = await ref.get();
  if (!snap.exists) return { error: 'Report not found.' };
  const existing = snap.data() as ErrorReportDoc;
  if (existing.tenantId !== auth.serverUser.tenantId) return { error: 'Report not found.' };

  await ref.update({
    status,
    resolvedByUserId: auth.serverUser.uid,
    resolvedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath('/admin/reports');
  return { ok: true };
}

export async function resolveErrorReport(reportId: string): Promise<ActionResult> {
  return setReportStatus(reportId, 'resolved');
}

export async function dismissErrorReport(reportId: string): Promise<ActionResult> {
  return setReportStatus(reportId, 'dismissed');
}
