import type { Profile } from '@/lib/db/schema';

export function buildProfileText(profile: Profile): string {
  return `
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone || 'Not provided'}
Summary: ${profile.summary || 'Not provided'}
Skills: ${profile.skills.join(', ') || 'None listed'}
Experience: ${profile.experience.map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join('\n') || 'None listed'}
Education: ${profile.education.map(e => `${e.degree} in ${e.field} at ${e.institution} (${e.startDate} - ${e.endDate})`).join('\n') || 'None listed'}
Projects: ${profile.projects.map(p => `${p.name}: ${p.description}`).join('\n') || 'None listed'}
`.trim();
}
