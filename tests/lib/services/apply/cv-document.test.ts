import { describe, it, expect } from 'vitest';
import { buildCvDocx, cvAttachmentName } from '@/lib/services/apply/cv-document';
import type { Profile } from '@/lib/db/schema';

const profile = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Caleb Levy Buntu',
  email: 'caleb@example.com',
  phone: '+250 700 000 000',
  links: { GitHub: 'https://github.com/caleb' },
  summary: 'Backend developer building APIs.',
  skills: ['TypeScript', 'Postgres'],
  education: [
    { institution: 'University of Rwanda', degree: 'BSc', field: 'Computer Science', startDate: '2018', endDate: '2022' },
  ],
  experience: [
    { company: 'Acme', role: 'Backend Developer', startDate: '2022', endDate: 'Present', description: 'Built APIs.' },
  ],
  projects: [{ name: 'Pathfolio', description: 'Application tracker.' }],
  savedAnswers: {},
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Profile;

describe('buildCvDocx', () => {
  it('produces a real DOCX archive', async () => {
    const buffer = await buildCvDocx(profile);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });

  it('handles a profile with only the required fields', async () => {
    const minimal = { ...profile, phone: null, summary: null, skills: [], education: [], experience: [], projects: [], links: {} };
    const buffer = await buildCvDocx(minimal);
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
  });
});

describe('cvAttachmentName', () => {
  it('makes a filesystem-safe file name', () => {
    expect(cvAttachmentName(profile)).toBe('Caleb-Levy-Buntu-CV.docx');
    expect(cvAttachmentName({ ...profile, name: '  ' })).toBe('candidate-CV.docx');
  });
});
