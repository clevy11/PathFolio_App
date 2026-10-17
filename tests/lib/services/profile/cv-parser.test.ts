import { describe, it, expect } from 'vitest';
import { parseCVText, parseDateRange } from '@/lib/services/profile/cv-parser';

const CV = `JANE DOE

Software Engineer

jane.doe@example.com   •   +1 555 123 4567   •   Kigali, Rwanda   •   linkedin.com/in/janedoe   •   github.com/janedoe

PROFILE

Software Engineer with experience building web applications.

PROFESSIONAL EXPERIENCE

Senior Engineer  |  Acme

June 2021 – April 2023   •   Remote

Built REST APIs.

Led migration to microservices.

Analyst  |  Globex

January 2019 – June 2021   •   Onsite

Wrote reports.

SKILLS

Java

Spring Boot

React.js

PROJECTS

TipTune – DJ Requests  (Next.js)

Built real-time requests.

EDUCATION

Bachelor's Degree in Software Engineering — Distinction

Example University   •   April 2015 – 2019   •   Kigali`;

describe('parseDateRange', () => {
  it('parses a month-year range', () => {
    expect(parseDateRange('June 2021 – April 2023')).toEqual({ startDate: 'June 2021', endDate: 'April 2023' });
  });

  it('parses a mixed range with a bare year', () => {
    expect(parseDateRange('April 2015 – 2019')).toEqual({ startDate: 'April 2015', endDate: '2019' });
  });

  it('parses an open-ended range', () => {
    expect(parseDateRange('2023 – Present')).toEqual({ startDate: '2023', endDate: 'Present' });
  });

  it('returns empty strings when there is no date', () => {
    expect(parseDateRange('Kigali, Rwanda')).toEqual({ startDate: '', endDate: '' });
  });
});

describe('parseCVText', () => {
  const sections = parseCVText(CV);

  it('extracts contact details and links', () => {
    expect(sections.name).toBe('JANE DOE');
    expect(sections.email).toBe('jane.doe@example.com');
    expect(sections.phone).toBe('+1 555 123 4567');
    expect(sections.links).toEqual({
      linkedin: 'https://linkedin.com/in/janedoe',
      github: 'https://github.com/janedoe',
    });
  });

  it('extracts the summary', () => {
    expect(sections.summary).toBe('Software Engineer with experience building web applications.');
  });

  it('splits experience into separate entries with dates', () => {
    expect(sections.experience).toHaveLength(2);
    expect(sections.experience?.[0]).toEqual({
      role: 'Senior Engineer',
      company: 'Acme',
      startDate: 'June 2021',
      endDate: 'April 2023',
      description: 'Built REST APIs. Led migration to microservices.',
    });
    expect(sections.experience?.[1]).toMatchObject({
      role: 'Analyst',
      company: 'Globex',
      startDate: 'January 2019',
      endDate: 'June 2021',
      description: 'Wrote reports.',
    });
  });

  it('extracts skills as a list', () => {
    expect(sections.skills).toEqual(['Java', 'Spring Boot', 'React.js']);
  });

  it('extracts projects with technologies', () => {
    expect(sections.projects).toEqual([
      { name: 'TipTune', description: 'DJ Requests Built real-time requests.', technologies: ['Next.js'] },
    ]);
  });

  it('extracts education with degree, field, and dates', () => {
    expect(sections.education).toEqual([
      {
        institution: 'Example University',
        degree: "Bachelor's Degree",
        field: 'Software Engineering',
        startDate: 'April 2015',
        endDate: '2019',
        description: 'Distinction',
      },
    ]);
  });
});

describe('parseCVText section boundaries', () => {
  it('does not let certificates, languages, or a declaration bleed into education', () => {
    const text = `JANE DOE

EDUCATION

Bachelor's Degree in Software Engineering — Distinction

Example University   •   April 2015 – 2019   •   Kigali

CERTIFICATES

Certificate of English Proficiency

LANGUAGES

French   •   Kinyarwanda   •   English

DECLARATION & SIGNATURE

I confirm the information is accurate.`;
    const sections = parseCVText(text);
    expect(sections.education).toHaveLength(1);
    expect(sections.education?.[0].institution).toBe('Example University');
  });
});
