import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Mission Control', href: '/dashboard', icon: 'squares-four' },
  { name: 'Applications', href: '/dashboard/applications', icon: 'briefcase' },
  { name: 'CV Vault', href: '/dashboard/cv-vault', icon: 'file-text' },
  { name: 'Interviews', href: '/dashboard/interviews', icon: 'calendar-blank' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: 'chart-line-up' },
];

const navigationIcons: Record<string, JSX.Element> = {
  'squares-four': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  'briefcase': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  'file-text': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  'calendar-blank': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  'chart-line-up': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';

  return (
    <div className="flex min-h-screen bg-navy-900 text-white font-sans antialiased">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        @import url('https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/*');
      `}</style>

      <aside className="w-64 hidden lg:flex flex-col border-r border-white/5 bg-navy-900/50 backdrop-blur-md shrink-0 z-10">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-azure-500 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.5)]">
              <svg className="w-5 h-5 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Pathfolio</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                  isActive
                    ? 'bg-white/5 border border-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {navigationIcons[item.icon] || (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                )}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="glass-panel rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-xl rounded-full" />
            <p className="text-xs text-slate-400 mb-2">Pro Plan</p>
            <p className="text-sm font-medium mb-3">Unlimited AI tailoring</p>
            <button className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors">
              Manage Plan
            </button>
          </div>
          <div className="flex items-center gap-3 mt-6 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-azure-500 flex items-center justify-center font-medium">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-slate-500 truncate">Software Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-20 px-6 lg:px-8 flex items-center justify-between border-b border-white/5 bg-navy-900/30 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">Mission Control</h1>
            <p className="text-xs text-slate-500">Your job application command center</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-navy-900 text-sm font-semibold hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Mission
            </Link>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}