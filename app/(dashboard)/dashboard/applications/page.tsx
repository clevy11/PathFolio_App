'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ApplicationRecord {
  id: string;
  status: string;
  method: string;
  dateApplied: string | null;
  followUpDate: string | null;
  notes: string | null;
  opportunity: {
    title: string;
    organization: string;
    region: string | null;
    link: string | null;
    type: string;
  };
}

const STATUS_OPTIONS = ['draft', 'sent', 'interview', 'offer', 'rejected', 'withdrawn'] as const;

const statusStyles: Record<string, string> = {
  draft: 'text-slate-300 bg-white/5 border-white/10',
  sent: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
  interview: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  offer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  withdrawn: 'text-slate-400 bg-white/5 border-white/10',
};

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function daysSince(value: string | null): number | null {
  if (!value) return null;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [status, setStatus] = useState('all');
  const [staleDays, setStaleDays] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (staleDays) params.set('staleDays', staleDays);
    return params.toString();
  }, [status, staleDays]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications${query ? `?${query}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load applications');
        return;
      }
      setApplications(data.applications ?? []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, next: string) => {
    setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, status: next } : item)));
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) await load();
    } catch (err) {
      console.error('Failed to update status:', err);
      await load();
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (res.ok) setApplications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Applications</h2>
          <p className="text-sm text-slate-500">Every application you send, tracked in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <a href={`/api/applications/export${query ? `?${query}` : ''}`} className="btn-secondary">
            Export CSV
          </a>
          <Link href="/dashboard/applications/new" className="btn-primary">
            New Application
          </Link>
        </div>
      </div>

      <Card className="glass-panel">
        <CardContent className="flex flex-wrap items-end gap-4 p-5">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-navy-800/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">No reply after (days)</label>
            <input
              type="number"
              min={1}
              value={staleDays}
              onChange={(e) => setStaleDays(e.target.value)}
              placeholder="e.g. 14"
              className="w-32 rounded-lg border border-white/10 bg-navy-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          {(status !== 'all' || staleDays) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus('all');
                setStaleDays('');
              }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {isLoading && <p className="text-sm text-slate-500">Loading applications...</p>}

      {!isLoading && applications.length === 0 && !error && (
        <Card className="glass-panel">
          <CardContent className="p-10 text-center">
            <p className="text-slate-400">No applications match your filters.</p>
            <Link href="/dashboard/applications/new" className="btn-primary mt-4 inline-flex">
              Add your first application
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {applications.map((item) => {
          const age = daysSince(item.dateApplied);
          return (
            <Card key={item.id} className="glass-panel">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.opportunity.title}</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                      {item.opportunity.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {item.opportunity.organization}
                    {item.opportunity.region ? ` · ${item.opportunity.region}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.method} · applied {formatDate(item.dateApplied)}
                    {age !== null ? ` (${age}d ago)` : ''}
                    {item.followUpDate ? ` · follow up ${formatDate(item.followUpDate)}` : ''}
                  </p>
                  {item.notes && <p className="text-xs text-slate-400">{item.notes}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                      statusStyles[item.status] ?? statusStyles.draft
                    )}
                  >
                    {item.status}
                  </span>
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    aria-label={`Status for ${item.opportunity.title}`}
                    className="rounded-lg border border-white/10 bg-navy-800/50 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
