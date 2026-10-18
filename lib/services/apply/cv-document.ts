import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { Profile } from '@/lib/db/schema';

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 40 } });
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'candidate';
}

export function cvAttachmentName(profile: Profile): string {
  return `${safeName(profile.name)}-CV.docx`;
}

/**
 * Generates the CV attachment from master-profile fields only, so the emailed
 * document can never contain facts the user has not saved.
 */
export async function buildCvDocx(profile: Profile): Promise<Buffer> {
  const contact = [profile.email, profile.phone, ...Object.values(profile.links ?? {})].filter(Boolean).join('  ·  ');

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: profile.name, bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: contact, size: 18, color: '555555' })],
    }),
  ];

  if (profile.summary) {
    children.push(heading('Summary'), new Paragraph({ text: profile.summary, spacing: { after: 80 } }));
  }

  if (profile.skills.length > 0) {
    children.push(heading('Skills'), new Paragraph({ text: profile.skills.join(' · '), spacing: { after: 80 } }));
  }

  if (profile.experience.length > 0) {
    children.push(heading('Experience'));
    for (const entry of profile.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: `${entry.role} — ${entry.company}`, bold: true }),
            new TextRun({ text: `  (${entry.startDate} – ${entry.endDate})`, color: '666666' }),
          ],
        })
      );
      if (entry.description) children.push(bullet(entry.description));
      if (entry.technologies?.length) children.push(bullet(`Technologies: ${entry.technologies.join(', ')}`));
    }
  }

  if (profile.education.length > 0) {
    children.push(heading('Education'));
    for (const entry of profile.education) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: `${entry.degree}${entry.field ? ` in ${entry.field}` : ''}`, bold: true }),
            new TextRun({ text: ` — ${entry.institution} (${entry.startDate} – ${entry.endDate})`, color: '444444' }),
          ],
        })
      );
      if (entry.description) children.push(bullet(entry.description));
    }
  }

  if (profile.projects.length > 0) {
    children.push(heading('Projects'));
    for (const entry of profile.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [new TextRun({ text: entry.name, bold: true })],
        })
      );
      if (entry.description) children.push(bullet(entry.description));
      if (entry.link) children.push(bullet(entry.link));
      if (entry.technologies?.length) children.push(bullet(entry.technologies.join(', ')));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
