'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export interface KitJob {
  title: string;
  company: string;
  url: string;
  location?: string;
  description?: string;
  source?: string;
}

interface PostingDetails {
  fetched: boolean;
  error?: string;
  emails: string[];
  applyUrls: string[];
  documents: string[];
  deadline: string | null;
  requirements: string[];
  route: 'email' | 'form' | 'guided';
}

interface PreparedApplication {
  email: {
    to: string | null;
    subject: string;
    body: string;
    source: 'ai' | 'template';
    warning?: string;
  };
  posting: PostingDetails;
  attachment: string;
  emailConfigured: boolean;
}

const inputClass =
  'w-full bg-navy-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

const routeLabel: Record<PostingDetails['route'], string> = {
  email: 'Apply by email',
  form: 'Apply on a web form',
  guided: 'No email or form found — follow the posting',
};

export function ApplicationKit({ job }: { job: KitJob }) {
  const [prepared, setPrepared] = useState<PreparedApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [to, setTo] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const prepare = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/jobs/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not prepare the application');
      setPrepared(data);
      setSubject(data.email.subject);
      setBody(data.email.body);
      setTo(data.email.to ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare the application');
    } finally {
      setLoading(false);
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`);
      setNotice('Email copied to clipboard.');
    } catch {
      setNotice('Could not copy — select the text manually.');
    }
  };

  const saveDraft = async () => {
    setSavingDraft(true);
    setNotice(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmDuplicate: true,
          opportunity: {
            type: 'job',
            title: job.title,
            organization: job.company,
            region: job.location || undefined,
            link: job.url,
            source: job.source || undefined,
          },
          application: {
            method: prepared?.posting.route ?? 'email',
            status: 'draft',
            contactEmail: to || undefined,
            notes: `Draft prepared by Pathfolio.\n\nSubject: ${subject}\n\n${body}`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save the draft');
      setNotice('Saved as a draft in the tracker.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save the draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const send = async (confirmDuplicate = false) => {
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch('/api/jobs/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          to,
          subject,
          body,
          confirmDuplicate,
          job: {
            title: job.title,
            company: job.company,
            url: job.url,
            location: job.location,
            source: job.source,
          },
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setDuplicateWarning(true);
        setConfirmingSend(false);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? 'Sending failed');
      setSentTo(data.sentTo ?? to);
      setConfirmingSend(false);
      setNotice(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Sending failed');
      setConfirmingSend(false);
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
        <p className="text-emerald-400">Application sent to {sentTo}.</p>
        <p className="mt-1 text-xs text-slate-400">
          It is recorded in your tracker with a follow-up date.{' '}
          <Link href="/dashboard/applications" className="text-emerald-400 underline-offset-2 hover:underline">
            Open applications
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!prepared && !loading && (
        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <p className="text-xs text-slate-500">
            Reads the posting, finds the contact email and requested documents, and drafts an email from your profile.
          </p>
          <Button variant="outline" size="sm" onClick={prepare} className="shrink-0">
            Prepare application
          </Button>
        </div>
      )}

      {loading && (
        <p className="border-t border-white/5 pt-4 text-sm text-slate-400">
          Reading the posting and writing the draft… this can take up to a minute on the free model.
        </p>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 border-t border-rose-500/20 pt-4">
          <p className="text-sm text-rose-400">{error}</p>
          <Button variant="outline" size="sm" onClick={prepare}>Try again</Button>
        </div>
      )}

      {prepared && (
        <div className="space-y-4 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-emerald-400">
              {routeLabel[prepared.posting.route]}
            </span>
            {prepared.posting.deadline && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-amber-400">
                Deadline: {prepared.posting.deadline}
              </span>
            )}
            <span className="rounded-md border border-white/10 px-2 py-1 text-slate-400">
              Attaches {prepared.attachment}
            </span>
          </div>

          {prepared.posting.error && (
            <p className="text-xs text-amber-400">
              {prepared.posting.error} The draft uses the listing text only — open the posting to confirm the contact.
            </p>
          )}

          {prepared.posting.documents.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-20 text-[10px] uppercase tracking-wide text-slate-500">they ask for</span>
              {prepared.posting.documents.map((doc) => (
                <span key={doc} className="rounded-md border border-azure-500/30 bg-azure-500/5 px-2 py-0.5 text-xs text-azure-400">
                  {doc}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No document list found on the posting.</p>
          )}

          {prepared.posting.requirements.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">From the posting</p>
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-slate-400">
                {prepared.posting.requirements.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {prepared.email.warning && (
            <p className="text-xs text-amber-400">{prepared.email.warning}</p>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                To{' '}
                {prepared.posting.emails.length > 0 ? (
                  <span className="text-slate-500">— found on the posting, check before sending</span>
                ) : (
                  <span className="text-amber-400">— no email found on the posting; enter one only if you verified it</span>
                )}
              </label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="jobs@company.com"
                className={inputClass}
              />
              {prepared.posting.applyUrls[0] && (
                <a
                  href={prepared.posting.applyUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-emerald-400 hover:underline"
                >
                  Their application form
                </a>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Email {prepared.email.source === 'ai' ? '(drafted from your profile)' : '(offline template)'} — edit freely
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className={cn(inputClass, 'resize-y font-mono text-xs leading-relaxed')}
              />
            </div>
          </div>

          {notice && <p className="text-xs text-amber-400">{notice}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyDraft}>Copy email</Button>
            <Button variant="outline" size="sm" onClick={saveDraft} disabled={savingDraft}>
              {savingDraft ? 'Saving…' : 'Save draft'}
            </Button>
            {!confirmingSend && (
              <Button
                size="sm"
                onClick={() => setConfirmingSend(true)}
                disabled={!prepared.emailConfigured || !to.trim() || !subject.trim() || !body.trim()}
              >
                Send application
              </Button>
            )}
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-slate-400 hover:text-emerald-400">
              Open posting
            </a>
          </div>

          {!prepared.emailConfigured && (
            <p className="text-xs text-slate-500">
              Sending needs EMAIL_SERVER_HOST/USER/PASSWORD/FROM in your environment. You can still copy the email.
            </p>
          )}

          {duplicateWarning && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-300">
                You already tracked this opportunity. If this is a new attempt, you can send anyway.
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => send(true)} disabled={sending}>
                  {sending ? 'Sending…' : 'Send anyway'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDuplicateWarning(false)} disabled={sending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {confirmingSend && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-300">
                This sends the email now to <span className="font-medium">{to}</span> with {prepared.attachment} attached,
                and records it in your tracker.
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => send(false)} disabled={sending}>
                  {sending ? 'Sending…' : 'Approve & send'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmingSend(false)} disabled={sending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
