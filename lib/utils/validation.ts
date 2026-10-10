import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  links: z.record(z.string()).default({}),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  education: z.array(z.object({
    institution: z.string().min(1),
    degree: z.string().min(1),
    field: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    description: z.string().optional(),
  })).default([]),
  experience: z.array(z.object({
    company: z.string().min(1),
    role: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    description: z.string().min(1),
    technologies: z.array(z.string()).optional(),
  })).default([]),
  projects: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    link: z.string().url().optional().or(z.literal('')),
    technologies: z.array(z.string()).optional(),
  })).default([]),
  savedAnswers: z.record(z.string()).default({}),
});

export const opportunitySchema = z.object({
  type: z.enum(['job', 'school']),
  title: z.string().min(1),
  organization: z.string().min(1),
  region: z.string().optional(),
  link: z.string().url().optional().or(z.literal('')),
  deadline: z.string().datetime().optional(),
  requirements: z.string().optional(),
  source: z.string().optional(),
});

export const applicationSchema = z.object({
  opportunityId: z.string().uuid(),
  method: z.enum(['email', 'form', 'guided']),
  status: z.enum(['draft', 'sent', 'interview', 'offer', 'rejected', 'withdrawn']).default('draft'),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
});

export const documentSchema = z.object({
  applicationId: z.string().uuid(),
  type: z.enum(['cv', 'cover_letter', 'motivation_letter', 'transcript', 'recommendation', 'other']),
  content: z.string().optional(),
  filePath: z.string().optional(),
  version: z.number().int().positive().default(1),
});

export const checklistItemSchema = z.object({
  applicationId: z.string().uuid().optional(),
  schoolId: z.string().uuid().optional(),
  documentName: z.string().min(1),
  status: z.enum(['pending', 'completed', 'skipped']).default('pending'),
  dueDate: z.string().datetime().optional(),
}).refine(data => data.applicationId || data.schoolId, {
  message: 'Either applicationId or schoolId must be provided',
  path: ['applicationId'],
});

export const reminderSchema = z.object({
  applicationId: z.string().uuid(),
  date: z.string().datetime(),
  message: z.string().min(1),
  done: z.boolean().default(false),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;