import type { RegionFilter } from './filters';

const LOCATION_TOKENS: Array<{ region: RegionFilter; tokens: string[] }> = [
  { region: 'rwanda', tokens: ['rwanda', 'kigali', 'east africa', 'east african'] },
  {
    region: 'africa',
    tokens: [
      'africa',
      'african',
      'south africa',
      'kenya',
      'nairobi',
      'uganda',
      'kampala',
      'tanzania',
      'dar es salaam',
      'ethiopia',
      'addis ababa',
      'nigeria',
      'lagos',
      'abuja',
      'ghana',
      'accra',
      'johannesburg',
      'cape town',
      'egypt',
      'cairo',
      'morocco',
      'senegal',
      'zambia',
      'zimbabwe',
    ],
  },
  { region: 'united-kingdom', tokens: ['uk', 'united kingdom', 'britain', 'england', 'london'] },
  {
    region: 'united-states',
    tokens: ['united states', 'usa', 'u.s.', 'america', 'new york', 'san francisco'],
  },
  { region: 'canada', tokens: ['canada', 'toronto', 'vancouver', 'montreal'] },
  {
    region: 'europe',
    tokens: ['europe', 'european', 'emea', 'germany', 'france', 'netherlands', 'spain', 'poland', 'berlin', 'paris'],
  },
  { region: 'asia', tokens: ['asia', 'india', 'singapore', 'japan', 'apac', 'bangalore', 'manila'] },
  { region: 'oceania', tokens: ['australia', 'new zealand', 'oceania', 'sydney', 'melbourne', 'auckland'] },
  { region: 'remote', tokens: ['remote', 'work from home', 'wfh', 'anywhere'] },
];

const ALL_TOKENS = LOCATION_TOKENS.flatMap(({ tokens }) => tokens).sort((a, b) => b.length - a.length);

const LOCATION_PHRASE = new RegExp(
  `\\b(?:(?:jobs?|roles?|positions?|openings?|work|working|based|located)\\s+)?` +
    `(?:(?:in|at|near|around|within|across)\\s+)?` +
    `(?:${ALL_TOKENS.map(escapeRegExp).join('|')})\\b`,
  'gi'
);

const LEADING_NOISE = /^(?:show me|find me|find|search for|look for|i want|i need|any|all)\s+/i;
const TRAILING_NOISE = /\s+(?:jobs?|roles?|positions?|vacancies|openings?)$/i;

export interface ParsedJobQuery {
  query: string;
  region: RegionFilter | null;
}

/**
 * Turns "backend developer jobs in Rwanda" into role "backend developer" and
 * region "rwanda". The region is only set when the text names a place, so a
 * search for "data analyst" keeps region "any".
 */
export function parseJobQuery(raw: string): ParsedJobQuery {
  const input = raw.replace(/\s+/g, ' ').trim();
  if (!input) return { query: '', region: null };

  const region =
    LOCATION_TOKENS.find(({ tokens }) => tokens.some((token) => new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i').test(input)))
      ?.region ?? null;

  if (!region) return { query: input, region: null };

  const query = input
    .replace(LOCATION_PHRASE, ' ')
    .replace(/\s+/g, ' ')
    .replace(LEADING_NOISE, '')
    .replace(TRAILING_NOISE, '')
    .replace(/^[\s,;.-]+|[\s,;.-]+$/g, '')
    .trim();

  return { query, region };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
