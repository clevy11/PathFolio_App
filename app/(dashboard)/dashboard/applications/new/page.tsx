'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DuplicateMatch {
  id: string;
  title: string;
  organization: string;
  link: string | null;
}

const inputClass =
  'w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';
const labelClass = 'mb-1 block text-xs text-slate-400';

export default function NewApplicationPage() {
  const router = useRouter();
  const [type, setType] = useState('job');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [region, setRegion] = useState('');
  const [link, setLink] = useState('');
  const [method, setMethod] = useState('email');
  const [status, setStatus] = useState('sent');
  const [dateApplied, setDateApplied] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  const submit = async (confirmDuplicate: boolean) => {
    if (!title.trim() || !organization.trim()) {
      setError('Title and organization are required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmDuplicate,
          opportunity: {
            type,
            title,
            organization,
            region: region || undefined,
            link: link || undefined,
          },
          application: {
            method,
            status,
            dateApplied: dateApplied ? new Date(dateApplied).toISOString() : undefined,
            contactEmail: contactEmail || undefined,
            followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
            notes: notes || undefined,
          },
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setDuplicates(data.duplicates ?? []);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Failed to save application');
        return;
      }
      router.push('/dashboard/applications');
    } catch (err) {
      console.error('Failed to save application:', err);
      setError('Failed to save application');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">New Application</h2>
          <p className="text-sm text-slate-500">Record a job or school application you are sending</p>
        </div>
        <Link href="/dashboard/applications" className="btn-ghost">
          Back to tracker
        </Link>
      </div>

      {duplicates && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-400">Possible duplicate application</CardTitle>
            <CardDescription>
              You already tracked a matching opportunity. Review before adding it again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {duplicates.map((match) => (
              <div key={match.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                <p className="font-medium">{match.title}</p>
                <p className="text-xs text-slate-400">
                  {match.organization}
                  {match.link ? ` · ${match.link}` : ''}
                </p>
              </div>
            ))}
            <div className="flex gap-3">
              <Button onClick={() => submit(true)} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save anyway'}
              </Button>
              <Button variant="outline" onClick={() => setDuplicates(null)} disabled={isSaving}>
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-panel">
        <CardContent className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                <option value="job">Job</option>
                <option value="school">School</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
                <option value="email">Email</option>
                <option value="form">Online form</option>
                <option value="guided">Guided steps</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Backend Engineer" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Organization</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Acme Inc."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Region</label>
              <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="EU / Remote" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Link</label>
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date applied</label>
              <input
                type="date"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contact email</label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jobs@acme.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Follow-up date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Recruiter name, referral, salary expectation..."
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <Button onClick={() => submit(false)} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Application'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
