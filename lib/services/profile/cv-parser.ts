import pdfParse from 'pdf-parse';
import { extractRawText } from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export interface ParsedCV {
  rawText: string;
  sections: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    skills?: string[];
    education?: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string;
      description?: string;
    }>;
    experience?: Array<{
      company: string;
      role: string;
      startDate: string;
      endDate: string;
      description: string;
      technologies?: string[];
    }>;
    projects?: Array<{
      name: string;
      description: string;
      link?: string;
      technologies?: string[];
    }>;
  };
}

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

  const sections = extractSections(rawText);
  return { rawText, sections };
}

async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await extractRawText({ buffer });
  return result.value;
}

function extractSections(text: string): ParsedCV['sections'] {
  const sections: ParsedCV['sections'] = {};

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) sections.email = emailMatch[0];

  const phoneMatch = text.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{4,6}/);
  if (phoneMatch) sections.phone = phoneMatch[0];

  const nameLine = lines[0];
  if (nameLine && nameLine.length < 60 && !nameLine.includes('@')) {
    sections.name = nameLine;
  }

  const lowerText = text.toLowerCase();

  const summaryIdx = findSectionIndex(lines, ['summary', 'profile', 'objective', 'about']);
  if (summaryIdx !== -1) {
    sections.summary = extractSectionContent(lines, summaryIdx);
  }

  const skillsIdx = findSectionIndex(lines, ['skills', 'technologies', 'tech stack', 'competencies']);
  if (skillsIdx !== -1) {
    sections.skills = extractSkills(lines, skillsIdx);
  }

  const educationIdx = findSectionIndex(lines, ['education', 'academic', 'degrees']);
  if (educationIdx !== -1) {
    sections.education = extractEducation(lines, educationIdx);
  }

  const experienceIdx = findSectionIndex(lines, ['experience', 'work', 'employment', 'career', 'professional']);
  if (experienceIdx !== -1) {
    sections.experience = extractExperience(lines, experienceIdx);
  }

  const projectsIdx = findSectionIndex(lines, ['projects', 'portfolio', 'personal projects']);
  if (projectsIdx !== -1) {
    sections.projects = extractProjects(lines, projectsIdx);
  }

  return sections;
}

function findSectionIndex(lines: string[], keywords: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(k => line === k || line.startsWith(k + ':') || line.startsWith(k + ' '))) {
      return i;
    }
  }
  return -1;
}

function extractSectionContent(lines: string[], startIdx: number): string {
  const content: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (isSectionHeader(lines[i])) break;
    content.push(lines[i]);
  }
  return content.join(' ').trim();
}

function isSectionHeader(line: string): boolean {
  const lower = line.toLowerCase();
  const headers = ['summary', 'profile', 'objective', 'about', 'skills', 'technologies', 'tech stack', 'competencies', 'education', 'academic', 'degrees', 'experience', 'work', 'employment', 'career', 'professional', 'projects', 'portfolio'];
  return headers.some(h => lower === h || lower.startsWith(h + ':') || lower.startsWith(h + ' '));
}

function extractSkills(lines: string[], startIdx: number): string[] {
  const content = extractSectionContent(lines, startIdx);
  return content.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
}

function extractEducation(lines: string[], startIdx: number): ParsedCV['sections']['education'] {
  const content = extractSectionContent(lines, startIdx);
  const entries = content.split(/\n\s*\n/).filter(Boolean);
  return entries.map(e => {
    const lines = e.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      institution: lines[0] || '',
      degree: lines[1] || '',
      field: lines[2] || '',
      startDate: '',
      endDate: '',
      description: lines.slice(3).join(' '),
    };
  });
}

function extractExperience(lines: string[], startIdx: number): ParsedCV['sections']['experience'] {
  const content = extractSectionContent(lines, startIdx);
  const entries = content.split(/\n\s*\n/).filter(Boolean);
  return entries.map(e => {
    const lines = e.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      company: lines[0] || '',
      role: lines[1] || '',
      startDate: '',
      endDate: '',
      description: lines.slice(2).join(' '),
      technologies: [],
    };
  });
}

function extractProjects(lines: string[], startIdx: number): ParsedCV['sections']['projects'] {
  const content = extractSectionContent(lines, startIdx);
  const entries = content.split(/\n\s*\n/).filter(Boolean);
  return entries.map(e => {
    const lines = e.split('\n').map(l => l.trim()).filter(Boolean);
    return {
      name: lines[0] || '',
      description: lines.slice(1).join(' '),
      technologies: [],
    };
  });
}