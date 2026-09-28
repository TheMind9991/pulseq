import * as XLSX from 'xlsx';
import type { RawQuestionRow } from '@/lib/content/validateQuestionRow';

// Section 5.5.1's exact header row.
export const REQUIRED_COLUMNS = [
  'Question',
  'Chapter',
  'Score',
  'OptionA_Text',
  'OptionA_Explain',
  'OptionB_Text',
  'OptionB_Explain',
  'OptionC_Text',
  'OptionC_Explain',
  'OptionD_Text',
  'OptionD_Explain',
  'OptionE_Text',
  'OptionE_Explain',
  'Answer',
  'CorrectOption_Explanation',
  'Tags',
  'Reviewed',
  'Comment',
] as const;

export interface WorkbookRow {
  row: RawQuestionRow;
  rowNumber: number; // actual spreadsheet row number (header = row 1)
}

export type ParseWorkbookResult = { rows: WorkbookRow[] } | { error: string };

function colIndex(header: string[], name: string): number {
  return header.indexOf(name);
}

// Section 5.5.3 step 1: validate the header row and reject before parsing any data rows if
// required columns are missing. Stops at the first fully-blank row rather than the sheet's
// physical end (Section 5.5.3 step 2) — detected via the Question cell specifically, not "every
// cell empty": the real sample file's trailing 949 blank rows still carry a stray `false` in a
// checkbox-formatted Reviewed column, which a naive all-cells-empty check misses entirely.
export function parseWorkbook(buffer: ArrayBuffer): ParseWorkbookResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  } catch {
    return { error: 'Could not read this file — is it a valid .xlsx workbook?' };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { error: 'The workbook has no sheets.' };
  const sheet = workbook.Sheets[sheetName]!;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (rows.length === 0) return { error: 'The sheet is empty.' };

  const header = (rows[0] ?? []).map((h) => String(h).trim());
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return { error: `Missing required column(s): ${missing.join(', ')}.` };
  }

  const result: WorkbookRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i] ?? [];
    const question = String(raw[colIndex(header, 'Question')] ?? '').trim();
    if (!question) break;

    const get = (name: (typeof REQUIRED_COLUMNS)[number]) => raw[colIndex(header, name)];
    const row: RawQuestionRow = {
      Question: get('Question'),
      Chapter: get('Chapter'),
      Score: get('Score'),
      OptionA_Text: get('OptionA_Text'),
      OptionA_Explain: get('OptionA_Explain'),
      OptionB_Text: get('OptionB_Text'),
      OptionB_Explain: get('OptionB_Explain'),
      OptionC_Text: get('OptionC_Text'),
      OptionC_Explain: get('OptionC_Explain'),
      OptionD_Text: get('OptionD_Text'),
      OptionD_Explain: get('OptionD_Explain'),
      OptionE_Text: get('OptionE_Text'),
      OptionE_Explain: get('OptionE_Explain'),
      Answer: get('Answer'),
      CorrectOption_Explanation: get('CorrectOption_Explanation'),
      Tags: get('Tags'),
      Reviewed: get('Reviewed'),
      Comment: get('Comment'),
    };
    result.push({ row, rowNumber: i + 1 });
  }

  return { rows: result };
}
