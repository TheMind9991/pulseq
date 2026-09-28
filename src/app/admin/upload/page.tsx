'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { confirmBulkUpload, previewBulkUpload, type BulkUploadRowReport } from '@/app/admin/upload/actions';

const SEVERITY_BADGE_CLASSES: Record<BulkUploadRowReport['severity'], string> = {
  pass: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  fail: 'bg-danger/15 text-danger',
};

export default function BulkUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<BulkUploadRowReport[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handlePreview() {
    if (!file) return;
    setError(null);
    setImportedCount(null);
    setIsPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await previewBulkUpload(formData);
      if ('error' in result) {
        setError(result.error);
        setRows(null);
        return;
      }
      setRows(result.rows);
      // Every importable row (severity pass or warning, content resolved) starts selected —
      // failing rows never are, since toQuestionContent returns null for them.
      setSelected(new Set(result.rows.filter((r) => r.content !== null).map((r) => r.rowNumber)));
    } finally {
      setIsPreviewing(false);
    }
  }

  function toggleRow(rowNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  async function handleImport() {
    if (!rows) return;
    const items = rows.filter((r) => selected.has(r.rowNumber) && r.content !== null).map((r) => r.content!);
    if (items.length === 0) {
      setError('No rows selected to import.');
      return;
    }
    setError(null);
    setIsImporting(true);
    try {
      const result = await confirmBulkUpload(items);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setImportedCount(result.created);
      setRows(null);
      setFile(null);
      router.refresh();
    } finally {
      setIsImporting(false);
    }
  }

  const importableCount = rows?.filter((r) => r.content !== null).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold text-primary">Bulk upload</h1>
      <p className="mb-6 text-sm text-secondary">
        Upload an .xlsx workbook matching the standard question template. Every row is parsed and
        validated first — nothing is written to the question bank until you review the report and
        import.
      </p>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-secondary"
        />
        <Button onClick={handlePreview} disabled={!file || isPreviewing}>
          {isPreviewing ? 'Parsing...' : 'Preview'}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {importedCount !== null && (
        <p className="mt-4 rounded-md border border-success bg-success/10 px-3 py-2 text-sm text-success">
          Imported {importedCount} question(s) as drafts. Find them under Questions.
        </p>
      )}

      {rows && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-secondary">
              {rows.length} row(s) parsed &middot; {importableCount} importable &middot; {selected.size} selected
            </p>
            <Button onClick={handleImport} disabled={isImporting || selected.size === 0}>
              {isImporting ? 'Importing...' : `Import ${selected.size} selected`}
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-subtle bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle text-left text-secondary">
                  <th scope="col" className="px-3 py-3 font-medium"></th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Row
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Stem
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Subject / Topic
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Flags
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-subtle last:border-0 align-top">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.rowNumber)}
                        disabled={row.content === null}
                        onChange={() => toggleRow(row.rowNumber)}
                        className="accent-[rgb(var(--color-accent))]"
                      />
                    </td>
                    <td className="px-3 py-3 text-secondary">{row.rowNumber}</td>
                    <td className="max-w-xs truncate px-3 py-3 text-primary">{row.stem || '—'}</td>
                    <td className="px-3 py-3 text-secondary">
                      {row.subject ?? '—'} {row.topic ? `/ ${row.topic}` : ''}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASSES[row.severity]}`}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {row.flags.length === 0
                        ? '—'
                        : row.flags.map((f) => f.message).join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
