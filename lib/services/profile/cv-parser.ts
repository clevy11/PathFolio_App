import pdfParse from 'pdf-parse';
import { extractRawText } from 'mammoth';

export interface ParsedExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies?: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface ParsedProject {
  name: string;
  description: string;
  link?: string;
  technologies?: string[];
}

export interface ParsedCVSections {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  links?: Record<string, string>;
  education?: ParsedEducation[];
  experience?: ParsedExperience[];
  projects?: ParsedProject[];
}

export interface ParsedCV {
  rawText: string;
  sections: ParsedCVSections;
}

type SectionName = 'summary' | 'experience' | 'education' | 'skills' | 'projects';

const SECTION_KEYWORDS: Record<SectionName, string[]> = {
  summary: ['summary', 'profile', 'objective', 'about', 'professional summary'],
  experience: ['professional experience', 'work experience', 'experience', 'employment', 'career'],
  education: ['education', 'academic background', 'academics'],
  skills: ['skills', 'technical skills', 'core competencies', 'technologies', 'tech stack'],
  projects: ['projects', 'personal projects', 'selected projects', 'portfolio'],
};

// Headings we do not extract, but which end the section before them so their
// content does not bleed into the previous section.
const IGNORED_SECTIONS = [
  'certificates',
  'certifications',
  'languages',
  'declaration',
  'declaration & signature',
  'references',
  'awards',
  'achievements',
  'interests',
  'hobbies',
  'publications',
  'volunteering',
  'activities',
  'additional information',
];

export async function parseCV(buffer: Buffer, mimeType: string): Promise<ParsedCV> {
  let rawText = '';

  switch (mimeType) {
    case 'application/pdf':
      rawText = await parsePDF(buffer);
      break;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      rawText = await parseDOCX(buffer);
      break;
    case 'text/plain':
      rawText = buffer.toString('utf-8');
      break;
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }

  return { rawText, sections: parseCVText(rawText) };
}

// A scanned/image-only PDF yields only blank lines. Below this, treat the file
// as unreadable instead of extracting garbage from an empty string.
export const MIN_CV_TEXT_LENGTH = 40;

export function hasUsableCVText(rawText: string): boolean {
  return rawText.replace(/\s+/g, ' ').trim().length >= MIN_CV_TEXT_LENGTH;
}

async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await extractRawText({ buffer });
  return result.value;
}

export function parseCVText(text: string): ParsedCVSections {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: ParsedCVSections = {};

  const { email, phone, links } = extractContact(text);
  if (email) sections.email = email;
  if (phone) sections.phone = phone;
  if (Object.keys(links).length > 0) sections.links = links;

  const name = extractName(lines);
  if (name) sections.name = name;

  const grouped = splitSections(lines);

  if (grouped.summary) sections.summary = grouped.summary.join(' ').trim();
  if (grouped.skills) {
    const skills = parseSkills(grouped.skills);
    if (skills.length > 0) sections.skills = skills;
  }
  if (grouped.experience) {
    const entries = parseExperience(grouped.experience);
    if (entries.length > 0) sections.experience = entries;
  }
  if (grouped.education) {
    const entries = parseEducation(grouped.education);
    if (entries.length > 0) sections.education = entries;
  }
  if (grouped.projects) {
    const entries = parseProjects(grouped.projects);
    if (entries.length > 0) sections.projects = entries;
  }

  return sections;
}

function matchSection(line: string): SectionName | null {
  if (line.length > 40) return null;
  const lower = line.toLowerCase().replace(/[:•]+$/, '').trim();
  if (lower.split(/\s+/).length > 4) return null;

  for (const [name, keywords] of Object.entries(SECTION_KEYWORDS) as [SectionName, string[]][]) {
    if (keywords.some((keyword) => lower === keyword || lower.startsWith(`${keyword}:`))) return name;
  }
  return null;
}

function isIgnoredHeading(line: string): boolean {
  const lower = line.toLowerCase().replace(/[:•]+$/, '').trim();
  return IGNORED_SECTIONS.includes(lower);
}

function splitSections(lines: string[]): Partial<Record<SectionName, string[]>> {
  const result: Partial<Record<SectionName, string[]>> = {};
  let current: SectionName | null = null;

  for (const line of lines) {
    const section = matchSection(line);
    if (section) {
      current = section;
      result[current] = result[current] ?? [];
      continue;
    }
    if (isIgnoredHeading(line)) {
      current = null;
      continue;
    }
    if (current) result[current]!.push(line);
  }

  return result;
}

export function parseDateRange(text: string): { startDate: string; endDate: string } {
  const range = text.match(
    /([A-Za-z]+\.?\s+\d{4}|\d{4})\s*[–—-]\s*([A-Za-z]+\.?\s+\d{4}|\d{4}|present|current)/i
  );
  if (range) {
    return { startDate: range[1].trim(), endDate: range[2].trim() };
  }
  const single = text.match(/[A-Za-z]+\.?\s+\d{4}|\b\d{4}\b/);
  if (single) return { startDate: single[0].trim(), endDate: '' };
  return { startDate: '', endDate: '' };
}

function extractContact(text: string): { email?: string; phone?: string; links: Record<string, string> } {
  const links: Record<string, string> = {};

  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];

  const phone =
    text.match(/\+\d[\d\s().-]{7,}\d/)?.[0].trim() ??
    text.match(/\b\d{3}[\s.-]\d{3}[\s.-]\d{3,4}\b/)?.[0].trim();

  const linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s•|]+/i)?.[0];
  if (linkedin) links.linkedin = withProtocol(linkedin);

  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s•|]+/i)?.[0];
  if (github) links.github = withProtocol(github);

  return { email, phone, links };
}

function withProtocol(url: string): string {
  const cleaned = url.replace(/[.,;]+$/, '');
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function extractName(lines: string[]): string | undefined {
  const first = lines[0];
  if (!first) return undefined;
  if (first.length > 60 || first.includes('@') || /\d/.test(first)) return undefined;
  if (matchSection(first)) return undefined;
  if (/curriculum vitae|^resume$/i.test(first)) return undefined;
  if (first.split(/\s+/).length > 5) return undefined;
  return first;
}

function parseSkills(lines: string[]): string[] {
  const skills = lines
    .flatMap((line) => line.split(/[,;]/))
    .map((skill) => skill.trim())
    .filter(Boolean);
  return Array.from(new Set(skills));
}

function splitHeader(header: string): { role: string; company: string } {
  const parts = header.split('|').map((part) => part.trim());
  if (parts.length >= 2) return { role: parts[0], company: parts.slice(1).join(' ') };
  return { role: header.trim(), company: '' };
}

function hasSeparator(line: string): boolean {
  return line.includes('|');
}

function entryStarts(lines: string[], isStart: (line: string, index: number) => boolean): number[] {
  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isStart(lines[i], i)) starts.push(i);
  }
  return starts;
}

function parseExperience(lines: string[]): ParsedExperience[] {
  let starts = entryStarts(lines, (line) => hasSeparator(line));
  if (starts.length === 0) {
    starts = entryStarts(
      lines,
      (line, index) => !parseDateRange(line).startDate && Boolean(parseDateRange(lines[index + 1] ?? '').startDate)
    );
  }
  if (starts.length === 0) starts = [0];

  return starts.map((startIdx, position) => {
    const endIdx = position + 1 < starts.length ? starts[position + 1] : lines.length;
    const entryLines = lines.slice(startIdx, endIdx);
    const { role, company } = splitHeader(entryLines[0]);
    const dateLineIdx = entryLines.findIndex((line, index) => index > 0 && parseDateRange(line).startDate);
    const dates = dateLineIdx >= 0 ? parseDateRange(entryLines[dateLineIdx]) : { startDate: '', endDate: '' };
    const bullets = entryLines.filter((_, index) => index !== 0 && index !== dateLineIdx);

    return {
      role,
      company,
      startDate: dates.startDate,
      endDate: dates.endDate,
      description: bullets.join(' ').trim(),
    };
  });
}

function splitDegree(line: string): { degree: string; field: string; description: string } {
  if (!line) return { degree: '', field: '', description: '' };
  const [degreePart, ...rest] = line.split(/\s+in\s+/i);
  const remainder = rest.join(' in ');
  const [field, ...honours] = remainder.split(/\s+[—–-]\s+/);
  return {
    degree: degreePart.trim(),
    field: (field ?? '').trim(),
    description: honours.join(' ').trim(),
  };
}

function parseEducation(lines: string[]): ParsedEducation[] {
  const entries: ParsedEducation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isInstitutionLine = line.includes('•') || Boolean(parseDateRange(line).startDate);
    if (!isInstitutionLine) continue;

    const degreeLine = i > 0 ? lines[i - 1] : '';
    const parts = line.split('•').map((part) => part.trim());
    const institution = parts[0] ?? '';
    const dates = parseDateRange(parts.slice(1).join(' '));
    const { degree, field, description } = splitDegree(degreeLine);

    entries.push({
      institution,
      degree,
      field,
      startDate: dates.startDate,
      endDate: dates.endDate,
      ...(description ? { description } : {}),
    });
  }

  return entries;
}

function parseProjects(lines: string[]): ParsedProject[] {
  const starts = entryStarts(lines, (line) => !line.endsWith('.'));
  if (starts.length === 0) return [];

  return starts.map((startIdx, position) => {
    const endIdx = position + 1 < starts.length ? starts[position + 1] : lines.length;
    const entryLines = lines.slice(startIdx, endIdx);
    const header = entryLines[0];

    let technologies: string[] = [];
    let headerText = header;
    const techMatch = header.match(/\(([^)]*)\)\s*$/);
    if (techMatch) {
      technologies = techMatch[1]
        .split(',')
        .map((tech) => tech.trim())
        .filter(Boolean);
      headerText = header.slice(0, techMatch.index).trim();
    }

    const [namePart, ...descriptorParts] = headerText.split(/\s+[—–-]\s+/);
    const description = [descriptorParts.join(' ').trim(), ...entryLines.slice(1)].filter(Boolean).join(' ').trim();

    return {
      name: namePart.trim(),
      description,
      ...(technologies.length > 0 ? { technologies } : {}),
    };
  });
}
