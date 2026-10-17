export interface DuplicateCandidate {
  title: string;
  organization: string;
  link?: string | null;
}

export interface ExistingOpportunity {
  id: string;
  title: string;
  organization: string;
  link: string | null;
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeLink(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\/+$/, '');
}

export function getDuplicateMatches(
  candidate: DuplicateCandidate,
  existing: ExistingOpportunity[]
): ExistingOpportunity[] {
  const candidateLink = normalizeLink(candidate.link);
  const candidateTitle = normalizeText(candidate.title);
  const candidateOrganization = normalizeText(candidate.organization);

  return existing.filter((item) => {
    const sameLink = candidateLink !== '' && candidateLink === normalizeLink(item.link);
    const sameRole =
      candidateTitle !== '' &&
      candidateOrganization !== '' &&
      candidateTitle === normalizeText(item.title) &&
      candidateOrganization === normalizeText(item.organization);
    return sameLink || sameRole;
  });
}
