export interface CsvApplicationRow {
  title: string;
  organization: string;
  region: string | null;
  link: string | null;
  method: string;
  status: string;
  dateApplied: Date | null;
  contactEmail: string | null;
  followUpDate: Date | null;
  notes: string | null;
}

export const CSV_HEADERS = [
  'Title',
  'Organization',
  'Region',
  'Link',
  'Method',
  'Status',
  'Date Applied',
  'Contact Email',
  'Follow-up Date',
  'Notes',
] as const;

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: CsvApplicationRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.title,
        row.organization,
        row.region,
        row.link,
        row.method,
        row.status,
        row.dateApplied,
        row.contactEmail,
        row.followUpDate,
        row.notes,
      ]
        .map(escapeCsvField)
        .join(',')
    );
  }
  return lines.join('\r\n');
}
