export type JobSource =
  | 'remotive'
  | 'greenhouse'
  | 'lever'
  | 'adzuna'
  | 'jooble'
  | 'jobicy'
  | 'jobwebrwanda'
  | 'opportunityrw';

export type RoleType = 'full-time' | 'contract' | 'part-time' | 'internship' | 'temporary' | 'unknown';

export interface JobPosting {
  id: string;
  source: JobSource;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  roleType: RoleType;
  url: string;
  description: string;
  postedAt?: string;
  /** ISO closing date, only when the posting states one. */
  deadline?: string;
}

export interface JobSearchParams {
  query: string;
  limit?: number;
}

export interface JobSearchError {
  source: JobSource;
  message: string;
}