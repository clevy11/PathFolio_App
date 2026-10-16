'use client';

import { cn } from '@/lib/utils/cn';

interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'tailored' | 'deadline';
  title: string;
  company: string;
  time: string;
  status: 'pending' | 'completed' | 'upcoming';
}

const mockActivities: ActivityItem[] = [
  { id: '1', type: 'application', title: 'Senior Backend Engineer', company: 'Stripe', time: '2 hours ago', status: 'completed' },
  { id: '2', type: 'interview', title: 'System Design Interview', company: 'Vercel', time: 'Tomorrow 10:00 AM', status: 'upcoming' },
  { id: '3', type: 'tailored', title: 'CV tailored for', company: 'OpenAI', time: 'Yesterday', status: 'completed' },
  { id: '4', type: 'deadline', title: 'Application deadline', company: 'Anthropic', time: 'In 3 days', status: 'pending' },
  { id: '5', type: 'application', title: 'Full Stack Developer', company: 'Linear', time: '3 days ago', status: 'completed' },
];

const typeIcons = {
  application: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  interview: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  tailored: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 002 2z" /></svg>,
  deadline: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const statusColors = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  upcoming: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
};

export function RecentActivity() {
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
        <button className="text-xs text-slate-400 hover:text-white transition-colors">View all</button>
      </div>

      <div className="space-y-3">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className={cn(
              'flex items-center gap-4 p-3 rounded-xl transition-all',
              'hover:bg-white/5'
            )}
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border', statusColors[activity.status])}>
              {typeIcons[activity.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-slate-500 truncate">{activity.company}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', statusColors[activity.status])}>
                {activity.status}
              </span>
              <time className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}