'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

export function NeuralTailoringEngine() {
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ cv: string; coverLetter: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'cv' | 'cover'>('cv');

  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await res.json();
      if (data.tailoredCV && data.coverLetter) {
        setResult({ cv: data.tailoredCV, coverLetter: data.coverLetter });
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-display font-semibold text-lg">Neural Tailoring Engine</h2>
            <p className="text-xs text-slate-500">Paste a role description · get an optimized CV & cover letter in seconds</p>
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
              'w-full bg-navy-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all resize-none',
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
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10">
            {(['cv', 'cover'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                  activeTab === tab
                    ? 'bg-white/5 text-white border-b-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {tab === 'cv' ? 'Tailored CV' : 'Cover Letter'}
              </button>
            ))}
          </div>
          <div className="bg-navy-800/50 border border-white/10 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {activeTab === 'cv' ? result.cv : result.coverLetter}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(activeTab === 'cv' ? result.cv : result.coverLetter)}>
              Copy to Clipboard
            </Button>
            <Button variant="outline">
              Save to CV Vault
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function pulseDot() {
  return (
    <style jsx>{`
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
  );
}