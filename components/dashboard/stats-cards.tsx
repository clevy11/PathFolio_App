'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  progress?: number;
  icon: React.ReactNode;
  variant: 'emerald' | 'azure' | 'amber' | 'rose';
}

interface ApplicationStats {
  total: number;
  active: number;
  interviews: number;
  offers: number;
  awaitingReply: number;
}

const variantClasses = {
  emerald: 'stat-card-emerald',
  azure: 'stat-card-azure',
  amber: 'stat-card-amber',
  rose: 'stat-card-rose',
};

const iconBgClasses = {
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  azure: 'bg-azure-500/10 border-azure-500/20 text-azure-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
};

const progressBgClasses = {
  emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  azure: 'bg-gradient-to-r from-azure-500 to-emerald-400',
  amber: 'bg-gradient-to-r from-amber-500 to-orange-400',
  rose: 'bg-gradient-to-r from-rose-500 to-pink-400',
};

export function StatCard({ title, value, subtitle, trend, progress, icon, variant }: StatCardProps) {
  return (
    <div className={cn(variantClasses[variant], 'group')}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-transparent via-white/5 to-transparent rounded-full blur-xl" />
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="text-sm text-slate-400">{title}</span>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBgClasses[variant])}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2 relative z-10">
        <span className="font-display text-4xl font-bold">{value}</span>
        {subtitle && <span className="text-sm text-slate-500 mb-1">{subtitle}</span>}
      </div>
      {trend && (
        <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-emerald-400' : 'text-rose-400')}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.positive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V5'} />
          </svg>
          <span>{trend.value}</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', progressBgClasses[variant])}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function StatsCards() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        else setFailed(true);
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
        setFailed(true);
      });
  }, []);

  if (failed) {
    return <p className="text-sm text-slate-500">Could not load your stats right now.</p>;
  }

  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const interviews = stats?.interviews ?? 0;
  const offers = stats?.offers ?? 0;
  const awaitingReply = stats?.awaitingReply ?? 0;
  const activeProgress = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Applications"
        value={`${total}`}
        subtitle="tracked"
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        variant="azure"
      />
      <StatCard
        title="Active"
        value={`${active}`}
        subtitle="in progress"
        progress={activeProgress}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        variant="emerald"
      />
      <StatCard
        title="Awaiting Reply"
        value={`${awaitingReply}`}
        subtitle="sent, no response"
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        variant="amber"
      />
      <StatCard
        title="Interviews"
        value={`${interviews}`}
        subtitle={offers > 0 ? `${offers} offer${offers === 1 ? '' : 's'}` : 'scheduled'}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        variant="rose"
      />
    </div>
  );
}
