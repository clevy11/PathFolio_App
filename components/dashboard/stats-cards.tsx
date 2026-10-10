'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  progress?: number;
  icon: React.ReactNode;
  color: 'azure' | 'emerald' | 'amber' | 'rose';
}

export function StatCard({ title, value, subtitle, trend, progress, icon, color }: StatCardProps) {
  const colorClasses = {
    azure: { glow: 'glow-azure', bg: 'from-azure-500 to-emerald-400', iconBg: 'bg-azure-500/10 border-azure-500/20', text: 'text-azure-400' },
    emerald: { glow: 'glow-emerald', bg: 'from-emerald-500 to-teal-400', iconBg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    amber: { glow: 'glow-amber', bg: 'from-amber-500 to-orange-400', iconBg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    rose: { glow: 'glow-rose', bg: 'from-rose-500 to-pink-400', iconBg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
  };

  const c = colorClasses[color];

  return (
    <div className={cn('glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-colors', c.glow)}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-transparent via-white/5 to-transparent rounded-full blur-xl" />
      <div className="flex justify-between items-start mb-3 relative z-10">
        <span className="text-sm text-slate-400">{title}</span>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.iconBg)}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2 relative z-10">
        <span className="font-display text-4xl font-bold">{value}</span>
        {subtitle && <span className="text-lg text-slate-500 mb-1">{subtitle}</span>}
      </div>
      {trend && (
        <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-emerald-400' : 'text-rose-400')}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.positive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V5"} />
          </svg>
          <span>{trend.value}</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', c.bg)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function StatsCards() {
  const [stats, setStats] = useState<{
    matchIndex: number;
    activeApplications: number;
    interviewPulse: number;
  }>({
    matchIndex: 0,
    activeApplications: 0,
    interviewPulse: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setStats({
        matchIndex: Math.min(100, stats.matchIndex + Math.random() * 2),
        activeApplications: stats.activeApplications,
        interviewPulse: stats.interviewPulse,
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [stats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Match Index"
        value={`${Math.round(stats.matchIndex)}%`}
        subtitle="Avg. role compatibility"
        trend={{ value: '+6%', positive: true }}
        progress={stats.matchIndex}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        color="azure"
      />
      <StatCard
        title="Active Applications"
        value={`${stats.activeApplications}`}
        subtitle="across 8 firms"
        trend={{ value: '2 new this week', positive: true }}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        color="emerald"
      />
      <StatCard
        title="Interview Pulse"
        value={`${stats.interviewPulse}`}
        subtitle="First round · Stripe tomorrow"
        trend={{ value: '+2 new', positive: true }}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        color="amber"
      />
    </div>
  );
}