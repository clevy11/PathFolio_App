import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonProps {
  title: string;
  description: string;
  phase: string;
}

export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-10 text-center">
        <span className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          {phase}
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
