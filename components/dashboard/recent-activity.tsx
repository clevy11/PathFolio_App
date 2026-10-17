'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface ApplicationRecord {
  id: string;
  status: string;
  dateApplied: string | null;
  opportunity: { title: string; organization: string };
}

const statusColors: Record<string, string> = {
  draft: 'text-slate-300 bg-white/5 border-white/10',
  sent: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
  interview: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  offer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  withdrawn: 'text-slate-400 bg-white/5 border-white/10',
};

const applicationIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

function relativeTime(value: string | null): string {
  if (!value) return 'no date';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function RecentActivity() {
  const [items, setItems] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setItems((data.applications ?? []).slice(0, 5)))
      .catch((err) => console.error('Failed to load recent activity:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-azure-500/10 border border-azure-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-azure-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">Recent Activity</h2>
            <p className="text-xs text-slate-500">Your latest mission updates</p>
          </div>
        </div>
        <Link href="/dashboard/applications" className="text-xs text-slate-400 hover:text-white transition-colors">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-slate-500">Loading activity...</p>}

        {!isLoading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            No applications yet. Add your first one to see activity here.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-xl p-3 transition-all hover:bg-white/5">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
                statusColors[item.status] ?? statusColors.draft
              )}
            >
              {applicationIcon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.opportunity.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.opportunity.organization}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border',
                  statusColors[item.status] ?? statusColors.draft
                )}
              >
                {item.status}
              </span>
              <time className="text-xs text-slate-500 whitespace-nowrap">{relativeTime(item.dateApplied)}</time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
