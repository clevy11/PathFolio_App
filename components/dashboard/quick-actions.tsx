'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const quickActions = [
  {
    title: 'Upload CV',
    description: 'Parse & extract sections automatically',
    href: '/dashboard/profile?tab=upload',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
    variant: 'emerald' as const,
  },
  {
    title: 'New Application',
    description: 'Track a new job or school application',
    href: '/dashboard/applications/new',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    variant: 'azure' as const,
  },
  {
    title: 'Tailor Documents',
    description: 'Generate CV & cover letter from JD',
    href: '/dashboard/tailor',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 002 2z" /></svg>,
    variant: 'amber' as const,
  },
  {
    title: 'CV Vault',
    description: 'Manage stored CV versions & templates',
    href: '/dashboard/profile',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    variant: 'rose' as const,
  },
];

const variantStyles = {
  emerald: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    hoverShadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    hoverBorder: 'hover:border-emerald-400/30',
  },
  azure: {
    iconBg: 'bg-azure-500/10 border-azure-500/20 text-azure-400',
    hoverShadow: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.2)]',
    hoverBorder: 'hover:border-azure-400/30',
  },
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    hoverShadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    hoverBorder: 'hover:border-amber-400/30',
  },
  rose: {
    iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    hoverShadow: 'hover:shadow-[0_0_20px_rgba(251,113,133,0.2)]',
    hoverBorder: 'hover:border-rose-400/30',
  },
};

export function QuickActions() {
  return (
    <div className="glass-panel p-6 animate-fade-in">
      <h2 className="font-display font-semibold text-lg mb-5">Quick Actions</h2>
      <div className="space-y-3">
        {quickActions.map((action) => {
          const style = variantStyles[action.variant];
          return (
            <Link
              key={action.title}
              href={action.href}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                'bg-white/5 hover:bg-white/10 border border-white/10',
                style.hoverShadow,
                style.hoverBorder,
                'animate-slide-up'
              )}
            >
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border',
                style.iconBg
              )}>
                {action.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-slate-500">{action.description}</p>
              </div>
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}