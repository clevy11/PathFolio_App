import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { application, opportunity } from '@/lib/db/schema';
import { getDuplicateMatches, type DuplicateCandidate, type ExistingOpportunity } from './dedupe';
import {
  DEFAULT_APPLICATION_FILTERS,
  matchesStaleFilter,
  type ApplicationFilters,
  type ApplicationMethod,
  type ApplicationStatus,
  type OpportunityType,
} from './filters';

export interface ApplicationRecord {
  id: string;
  status: ApplicationStatus;
  method: ApplicationMethod;
  dateApplied: Date | null;
  contactEmail: string | null;
  notes: string | null;
  followUpDate: Date | null;
  createdAt: Date;
  opportunity: {
    id: string;
    type: OpportunityType;
    title: string;
    organization: string;
    region: string | null;
    link: string | null;
  };
}

export interface CreateApplicationInput {
  opportunity: {
    type: OpportunityType;
    title: string;
    organization: string;
    region?: string | null;
    link?: string | null;
    deadline?: Date | null;
    source?: string | null;
    requirements?: string | null;
  };
  application: {
    method: ApplicationMethod;
    status?: ApplicationStatus;
    dateApplied?: Date | null;
    contactEmail?: string | null;
    notes?: string | null;
    followUpDate?: Date | null;
  };
}

export interface UpdateApplicationInput {
  status?: ApplicationStatus;
  method?: ApplicationMethod;
  dateApplied?: Date | null;
  contactEmail?: string | null;
  notes?: string | null;
  followUpDate?: Date | null;
}

export interface ApplicationStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  awaitingReply: number;
}

const ACTIVE_STATUSES: ApplicationStatus[] = ['draft', 'sent', 'interview'];

function applicationSelection() {
  return {
    id: application.id,
    status: application.status,
    method: application.method,
    dateApplied: application.dateApplied,
    contactEmail: application.contactEmail,
    notes: application.notes,
    followUpDate: application.followUpDate,
    createdAt: application.createdAt,
    opportunity: {
      id: opportunity.id,
      type: opportunity.type,
      title: opportunity.title,
      organization: opportunity.organization,
      region: opportunity.region,
      link: opportunity.link,
    },
  };
}

export async function listApplications(
  filters: ApplicationFilters = DEFAULT_APPLICATION_FILTERS
): Promise<ApplicationRecord[]> {
  const rows = await db
    .select(applicationSelection())
    .from(application)
    .innerJoin(opportunity, eq(application.opportunityId, opportunity.id))
    .orderBy(desc(application.createdAt));

  const byStatus = filters.status === 'all' ? rows : rows.filter((row) => row.status === filters.status);
  return byStatus.filter((row) => matchesStaleFilter(row, filters.staleDays));
}

export async function getApplication(id: string): Promise<ApplicationRecord | null> {
  const rows = await db
    .select(applicationSelection())
    .from(application)
    .innerJoin(opportunity, eq(application.opportunityId, opportunity.id))
    .where(eq(application.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createApplication(input: CreateApplicationInput): Promise<ApplicationRecord> {
  return db.transaction(async (tx) => {
    const [createdOpportunity] = await tx
      .insert(opportunity)
      .values({
        type: input.opportunity.type,
        title: input.opportunity.title,
        organization: input.opportunity.organization,
        region: input.opportunity.region ?? null,
        link: input.opportunity.link || null,
        deadline: input.opportunity.deadline ?? null,
        source: input.opportunity.source ?? null,
        requirements: input.opportunity.requirements ?? null,
      })
      .returning();

    const [createdApplication] = await tx
      .insert(application)
      .values({
        opportunityId: createdOpportunity.id,
        method: input.application.method,
        status: input.application.status ?? 'draft',
        dateApplied: input.application.dateApplied ?? null,
        contactEmail: input.application.contactEmail ?? null,
        notes: input.application.notes ?? null,
        followUpDate: input.application.followUpDate ?? null,
      })
      .returning();

    return {
      ...createdApplication,
      opportunity: {
        id: createdOpportunity.id,
        type: createdOpportunity.type,
        title: createdOpportunity.title,
        organization: createdOpportunity.organization,
        region: createdOpportunity.region,
        link: createdOpportunity.link,
      },
    };
  });
}

export async function updateApplication(
  id: string,
  patch: UpdateApplicationInput
): Promise<ApplicationRecord | null> {
  const updated = await db
    .update(application)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(application.id, id))
    .returning();

  if (updated.length === 0) return null;
  return getApplication(id);
}

export async function deleteApplication(id: string): Promise<boolean> {
  const deleted = await db.delete(application).where(eq(application.id, id)).returning();
  return deleted.length > 0;
}

export async function findDuplicateOpportunities(
  candidate: DuplicateCandidate
): Promise<ExistingOpportunity[]> {
  const rows = await db
    .select({
      id: opportunity.id,
      title: opportunity.title,
      organization: opportunity.organization,
      link: opportunity.link,
    })
    .from(opportunity);

  return getDuplicateMatches(candidate, rows);
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  const rows = await db.select({ status: application.status }).from(application);
  const countBy = (status: ApplicationStatus) => rows.filter((row) => row.status === status).length;

  return {
    total: rows.length,
    active: rows.filter((row) => ACTIVE_STATUSES.includes(row.status)).length,
    interviews: countBy('interview'),
    offers: countBy('offer'),
    awaitingReply: countBy('sent'),
  };
}
