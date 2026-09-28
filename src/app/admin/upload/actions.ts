'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { getServerUser } from '@/lib/auth/getServerUser';
import { parseWorkbook } from '@/lib/content/parseWorkbook';
import { validateQuestionRow, type RowFlag, type RowSeverity } from '@/lib/content/validateQuestionRow';
import { toQuestionContent } from '@/lib/content/toQuestionContent';
import { questionContentSchema, type QuestionContent } from '@/lib/schemas/question';

export interface BulkUploadRowReport {
  rowNumber: number;
  severity: RowSeverity;
  flags: RowFlag[];
  stem: string;
  subject?: string;
  topic?: string;
  content: QuestionContent | null; // null for failing rows — never importable
}

type PreviewResult = { rows: BulkUploadRowReport[] } | { error: string };
type ConfirmResult = { created: number } | { error: string };

async function requireEditor() {
  const serverUser = await getServerUser();
  if (!serverUser) return { ok: false as const, error: 'You must be signed in.' };
  if (serverUser.role !== 'editor' && serverUser.role !== 'admin') {
    return { ok: false as const, error: 'Only editors and admins can upload questions.' };
  }
  if (!serverUser.tenantId) return { ok: false as const, error: 'Missing tenant.' };
  return { ok: true as const, serverUser: { ...serverUser, tenantId: serverUser.tenantId } };
}

// Section 5.5.3: parses and validates every row but writes nothing — the report lets the admin
// deselect specific rows (in addition to failing rows, which are never importable) before
// anything touches Firestore. No server-side staging: the validated `content` for each
// pass/warning row round-trips through the client and comes back verbatim to confirmBulkUpload
// (see DECISIONS.md — fine at this content volume).
export async function previewBulkUpload(formData: FormData): Promise<PreviewResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'No file provided.' };

  const buffer = await file.arrayBuffer();
  const parsed = parseWorkbook(buffer);
  if ('error' in parsed) return { error: parsed.error };

  const rows: BulkUploadRowReport[] = parsed.rows.map(({ row, rowNumber }) => {
    const result = validateQuestionRow(row, rowNumber);
    return {
      rowNumber,
      severity: result.severity,
      flags: result.flags,
      stem: result.stem,
      subject: result.subject,
      topic: result.topic,
      content: toQuestionContent(result),
    };
  });

  return { rows };
}

// Writes only the rows the admin left selected. Re-validates every item against
// questionContentSchema server-side rather than trusting the client-held payload — the preview
// response is data the client can tamper with before it comes back here.
export async function confirmBulkUpload(items: QuestionContent[]): Promise<ConfirmResult> {
  const auth = await requireEditor();
  if (!auth.ok) return { error: auth.error };
  if (items.length === 0) return { error: 'No rows selected to import.' };

  const validated: QuestionContent[] = [];
  for (const item of items) {
    const parsed = questionContentSchema.safeParse(item);
    if (!parsed.success) return { error: 'One or more selected rows failed validation.' };
    validated.push(parsed.data);
  }

  const db = getAdminDb();
  const CHUNK_SIZE = 400; // Firestore batch limit is 500 writes
  for (let i = 0; i < validated.length; i += CHUNK_SIZE) {
    const batch = db.batch();
    for (const content of validated.slice(i, i + CHUNK_SIZE)) {
      const ref = db.collection('questions').doc();
      batch.set(ref, {
        ...content,
        status: 'draft',
        tenantId: auth.serverUser.tenantId,
        authorId: auth.serverUser.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return { created: validated.length };
}
