import { Suspense } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { NeuralTailoringEngine } from '@/components/dashboard/neural-tailoring-engine';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Suspense fallback={<NeuralTailoringEngineSkeleton />}>
            <NeuralTailoringEngine />
          </Suspense>

          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivity />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<QuickActionsSkeleton />}>
            <QuickActions />
          </Suspense>
        </div>
      </div>
    </>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel p-5 animate-pulse">
          <div className="h-4 w-1/3 bg-white/5 rounded mb-3" />
          <div className="h-10 w-1/2 bg-white/5 rounded" />
          <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function NeuralTailoringEngineSkeleton() {
  return (
    <div className="glass-panel p-6 animate-pulse space-y-4">
      <div className="h-6 w-1/3 bg-white/5 rounded" />
      <div className="h-10 w-full bg-white/5 rounded-xl" />
      <div className="h-10 w-full bg-white/5 rounded-xl" />
      <div className="h-32 w-full bg-white/5 rounded-xl" />
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="glass-panel p-6 animate-pulse space-y-4">
      <div className="h-6 w-1/4 bg-white/5 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-white/5 rounded" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="glass-panel p-6 animate-pulse space-y-4">
      <div className="h-6 w-1/4 bg-white/5 rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 w-full bg-white/5 rounded-xl" />
      ))}
    </div>
  );
}