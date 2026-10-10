import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const opportunityTypeEnum = pgEnum('opportunity_type', ['job', 'school']);
export const applicationMethodEnum = pgEnum('application_method', ['email', 'form', 'guided']);
export const applicationStatusEnum = pgEnum('application_status', ['draft', 'sent', 'interview', 'offer', 'rejected', 'withdrawn']);
export const documentTypeEnum = pgEnum('document_type', ['cv', 'cover_letter', 'motivation_letter', 'transcript', 'recommendation', 'other']);
export const checklistStatusEnum = pgEnum('checklist_status', ['pending', 'completed', 'skipped']);

export const profile = pgTable('profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  links: jsonb('links').$type<Record<string, string>>().default({}).notNull(),
  summary: text('summary'),
  skills: text('skills').array().default([]).notNull(),
  education: jsonb('education').$type<Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>>().default([]).notNull(),
  experience: jsonb('experience').$type<Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    technologies?: string[];
  }>>().default([]).notNull(),
  projects: jsonb('projects').$type<Array<{
    name: string;
    description: string;
    link?: string;
    technologies?: string[];
  }>>().default([]).notNull(),
  savedAnswers: jsonb('saved_answers').$type<Record<string, string>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const opportunity = pgTable('opportunity', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: opportunityTypeEnum('type').notNull(),
  title: text('title').notNull(),
  organization: text('organization').notNull(),
  region: text('region'),
  link: text('link'),
  deadline: timestamp('deadline', { withTimezone: true }),
  requirements: text('requirements'),
  source: text('source'),
  matchScore: integer('match_score'),
  missingSkills: text('missing_skills').array().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const application = pgTable('application', {
  id: uuid('id').primaryKey().defaultRandom(),
  opportunityId: uuid('opportunity_id').references(() => opportunity.id).notNull(),
  dateApplied: timestamp('date_applied', { withTimezone: true }),
  method: applicationMethodEnum('method').notNull(),
  status: applicationStatusEnum('status').default('draft').notNull(),
  contactEmail: text('contact_email'),
  notes: text('notes'),
  followUpDate: timestamp('follow_up_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const document = pgTable('document', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => application.id).notNull(),
  type: documentTypeEnum('type').notNull(),
  filePath: text('file_path'),
  content: text('content'),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const checklistItem = pgTable('checklist_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => application.id),
  schoolId: uuid('school_id').references(() => opportunity.id),
  documentName: text('document_name').notNull(),
  status: checklistStatusEnum('status').default('pending').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reminder = pgTable('reminder', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').references(() => application.id).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  message: text('message').notNull(),
  done: boolean('done').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profileRelations = relations(profile, ({ many }) => ({
  applications: many(application),
}));

export const opportunityRelations = relations(opportunity, ({ many }) => ({
  applications: many(application),
  checklistItems: many(checklistItem),
}));

export const applicationRelations = relations(application, ({ one, many }) => ({
  opportunity: one(opportunity, {
    fields: [application.opportunityId],
    references: [opportunity.id],
  }),
  documents: many(document),
  checklistItems: many(checklistItem),
  reminders: many(reminder),
}));

export const documentRelations = relations(document, ({ one }) => ({
  application: one(application, {
    fields: [document.applicationId],
    references: [application.id],
  }),
}));

export const checklistItemRelations = relations(checklistItem, ({ one }) => ({
  application: one(application, {
    fields: [checklistItem.applicationId],
    references: [application.id],
  }),
  school: one(opportunity, {
    fields: [checklistItem.schoolId],
    references: [opportunity.id],
  }),
}));

export const reminderRelations = relations(reminder, ({ one }) => ({
  application: one(application, {
    fields: [reminder.applicationId],
    references: [application.id],
  }),
}));

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export type Opportunity = typeof opportunity.$inferSelect;
export type NewOpportunity = typeof opportunity.$inferInsert;
export type Application = typeof application.$inferSelect;
export type NewApplication = typeof application.$inferInsert;
export type Document = typeof document.$inferSelect;
export type NewDocument = typeof document.$inferInsert;
export type ChecklistItem = typeof checklistItem.$inferSelect;
export type NewChecklistItem = typeof checklistItem.$inferInsert;
export type Reminder = typeof reminder.$inferSelect;
export type NewReminder = typeof reminder.$inferInsert;