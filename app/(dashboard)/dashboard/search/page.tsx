'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ScoredJob {
  id: string;
  source: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  roleType: string;
  url: string;
  postedAt?: string;
  match: { score: number; matchedSkills: string[]; missingSkills: string[] };
}

interface SourceStatus {
  source: string;
  used: boolean;
  ok: boolean;
  count: number;
  error?: string;
}

const regionOptions = [
  { value: 'any', label: 'Any region' },
  { value: 'remote', label: 'Remote only' },
  { value: 'united-states', label: 'United States' },
  { value: 'europe', label: 'Europe' },
  { value: 'united-kingdom', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'africa', label: 'Africa' },
  { value: 'asia', label: 'Asia' },
  { value: 'oceania', label: 'Oceania' },
];

const roleOptions = [
  { value: 'any', label: 'Any role type' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

function scoreBar(score: number): string {
  if (score >= 70) return 'from-emerald-500 to-teal-400';
  if (score >= 40) return 'from-amber-500 to-orange-400';
  return 'from-rose-500 to-pink-400';
}

export default function JobSearchPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('any');
  const [roleType, setRoleType] = useState('any');
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query.trim(), region, roleType });
      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setJobs(data.jobs ?? []);
      setSources(data.sources ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const failedSources = sources.filter((s) => s.used && !s.ok);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Job Search</h1>
        <p className="text-sm text-slate-500">
          Search public job boards, scored against your master profile (US-03, US-04)
        </p>
      </div>

      <Card className="glass-panel">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keywords, e.g. React, backend, data engineer"
              className="w-full bg-navy-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="bg-navy-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              >
                {regionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="bg-navy-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button type="submit" disabled={loading || !query.trim()} className="w-auto">
                {loading ? 'Searching…' : 'Search jobs'}
              </Button>
            </div>
          </form>

          {sources.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {sources.map((s) => (
                <span
                  key={s.source}
                  className={cn(
                    'px-2 py-1 rounded-lg border',
                    s.used && s.ok ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-slate-500'
                  )}
                  title={s.error ?? `${s.count} results`}
                >
                  {s.source} {s.used ? (s.ok ? `(${s.count})` : 'failed') : 'off'}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-xl p-3">{error}</p>
      )}
      {failedSources.length > 0 && !error && (
        <p className="text-xs text-amber-400">
          Some sources failed or are unconfigured: {failedSources.map((s) => s.source).join(', ')} — showing the rest.
        </p>
      )}

      {searched && !loading && jobs.length === 0 && !error && (
        <p className="text-sm text-slate-500">No jobs found for these filters. Try a broader query or region.</p>
      )}

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="glass-panel-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-emerald-400 transition-colors truncate">
                      {job.title}
                    </a>
                    <span className="text-xs px-2 py-0.5 rounded-md border border-white/10 text-slate-400">{job.source}</span>
                    {job.remote && <span className="text-xs px-2 py-0.5 rounded-md border border-azure-500/30 text-azure-400">remote</span>}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {job.company} · {job.location}
                    {job.roleType !== 'unknown' && <> · {job.roleType}</>}
                    {job.postedAt && <> · {job.postedAt.slice(0, 10)}</>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn('font-display text-2xl font-bold', scoreColor(job.match.score))}>
                    {job.match.score}
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">match</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', scoreBar(job.match.score))}
                  style={{ width: `${job.match.score}%` }}
                />
              </div>

              {(job.match.matchedSkills.length > 0 || job.match.missingSkills.length > 0) && (
                <div className="mt-3 space-y-2">
                  {job.match.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 w-14">have</span>
                      {job.match.matchedSkills.slice(0, 10).map((skill) => (
                        <span key={skill} className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{skill}</span>
                      ))}
                    </div>
                  )}
                  {job.match.missingSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 w-14">missing</span>
                      {job.match.missingSkills.slice(0, 10).map((skill) => (
                        <span key={skill} className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">View posting</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}