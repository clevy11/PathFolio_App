'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

interface TailoredResult {
  cv: string;
  coverLetter: string;
  source: string;
}

export function NeuralTailoringEngine() {
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TailoredResult | null>(null);
  const [activeTab, setActiveTab] = useState<'cv' | 'cover'>('cv');
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    setIsProcessing(true);
    setError(null);
    setApproved(false);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await res.json();
      if (!res.ok || !data.tailoredCV || !data.coverLetter) {
        setError(data.error ?? 'Failed to generate tailored documents');
        return;
      }
      setResult({
        cv: data.tailoredCV,
        coverLetter: data.coverLetter,
        source: data.source ?? '',
      });
    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate tailored documents');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentText = result ? (activeTab === 'cv' ? result.cv : result.coverLetter) : '';

  const handleEdit = (value: string) => {
    if (!result) return;
    setApproved(false);
    setResult(activeTab === 'cv' ? { ...result, cv: value } : { ...result, coverLetter: value });
  };

  const handleCopy = () => {
    if (currentText) {
      void navigator.clipboard.writeText(currentText);
    }
  };

  return (
    <div className="glass-panel p-6 animate-fade-in">
      <style jsx>{`
        .pulse-dot {
          position: relative;
        }
        .pulse-dot::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid #34d399;
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">Neural Tailoring Engine</h2>
            <p className="text-xs text-slate-500">Paste a role description · get an optimized CV &amp; cover letter in seconds</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          AI engine online
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here... (requirements, responsibilities, tech stack, etc.)"
            rows={6}
            className={cn(
              'w-full bg-navy-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all resize-none',
              'font-mono text-sm'
            )}
          />
          <p className="text-xs text-slate-500 mt-1 text-right">{jobDescription.length} / 10000 characters</p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isProcessing || !jobDescription.trim()}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Neural network optimizing...
            </>
          ) : (
            'Generate Tailored Documents'
          )}
        </Button>

        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>

      {result && (
        <div className="mt-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 border-b border-white/10">
            {(['cv', 'cover'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-xl transition-colors',
                  activeTab === tab
                    ? 'bg-white/5 text-white border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {tab === 'cv' ? 'Tailored CV' : 'Cover Letter'}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Source — your master profile
              </p>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-navy-800/50 p-4 font-mono text-xs text-slate-400">
                {result.source}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Tailored {activeTab === 'cv' ? 'CV' : 'cover letter'} — review &amp; edit
              </p>
              <textarea
                value={currentText}
                onChange={(e) => handleEdit(e.target.value)}
                rows={16}
                aria-label={activeTab === 'cv' ? 'Tailored CV' : 'Tailored cover letter'}
                className="h-96 w-full resize-y rounded-xl border border-white/10 bg-navy-800/50 p-4 font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setApproved(true)} disabled={approved}>
              {approved ? 'Document approved' : 'Approve document'}
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              Copy to clipboard
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={isProcessing}>
              Regenerate
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Review every line against your master profile before you use it. Nothing is sent
            or submitted automatically; saving approved versions to the CV Vault arrives with
            the tracker (Phase 2).
          </p>
        </div>
      )}
    </div>
  );
}
