export const APPLICATION_STATUSES = [
  'draft',
  'sent',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_METHODS = ['email', 'form', 'guided'] as const;
export type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

export const OPPORTUNITY_TYPES = ['job', 'school'] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export type StatusFilter = ApplicationStatus | 'all';

export interface ApplicationFilters {
  status: StatusFilter;
  staleDays: number | null;
}

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilters = { status: 'all', staleDays: null };

export function parseApplicationFilters(params: URLSearchParams): ApplicationFilters {
  const statusParam = params.get('status');
  const status: StatusFilter =
    statusParam && (APPLICATION_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as ApplicationStatus)
      : 'all';

  const staleParam = Number(params.get('staleDays'));
  const staleDays =
    params.get('staleDays') && Number.isInteger(staleParam) && staleParam > 0 ? staleParam : null;

  return { status, staleDays };
}

export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

export function isAwaitingReply(status: ApplicationStatus): boolean {
  return status === 'sent';
}

export function matchesStaleFilter(
  record: { status: ApplicationStatus; dateApplied: Date | null },
  staleDays: number | null,
  now: Date = new Date()
): boolean {
  if (staleDays === null) return true;
  if (record.status !== 'sent' || !record.dateApplied) return false;
  return daysSince(record.dateApplied, now) >= staleDays;
}
