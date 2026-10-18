import { describe, it, expect } from 'vitest';
import { extractEmails, extractPostingDetails, emptyPostingDetails } from '@/lib/services/apply/extract';
import { isSafePublicUrl } from '@/lib/services/apply/fetch-posting';

const html = `<!doctype html>
<html><body>
  <h1>Backend Developer</h1>
  <p>Acme Ltd is hiring in Kigali.</p>
  <h2>Requirements</h2>
  <ul>
    <li>3 years of Java or TypeScript</li>
    <li>REST API design</li>
  </ul>
  <h2>How to apply</h2>
  <p>Send your CV and cover letter to jobs@acme.rw.</p>
  <p>Deadline: 30 June 2026</p>
  <p>Questions: hr@acme.rw</p>
  <p>Ignore noreply@acme.rw and logo@2x.png</p>
  <a href="mailto:careers@acme.rw?subject=Job">Email us</a>
  <a href="https://acme.rw/apply">Apply now</a>
</body></html>`;

describe('extractEmails', () => {
  it('deduplicates, lowercases and ignores image and no-reply addresses', () => {
    const emails = extractEmails('Mail JOBS@Acme.rw or jobs@acme.rw, no-Reply@acme.rw, logo@2x.png, hero.png');
    expect(emails).toEqual(['jobs@acme.rw']);
  });
});

describe('extractPostingDetails', () => {
  it('finds the application email, documents, deadline and requirements', () => {
    const details = extractPostingDetails(html, 'https://acme.rw/jobs/1');

    expect(details.fetched).toBe(true);
    expect(details.route).toBe('email');
    expect(details.emails).toContain('careers@acme.rw');
    expect(details.emails).toContain('jobs@acme.rw');
    expect(details.emails).not.toContain('noreply@acme.rw');
    expect(details.documents).toEqual(expect.arrayContaining(['CV', 'Cover letter']));
    expect(details.deadline).toBe('30 June 2026');
    expect(details.requirements).toEqual(['3 years of Java or TypeScript', 'REST API design']);
    expect(details.applyUrls).toContain('https://acme.rw/apply');
  });

  it('finds an email that only exists in an inline script', () => {
    const details = extractPostingDetails(
      '<html><body><div id="job"></div><script>var description = "Send your CV\\r\\ncareers@echowa.com";</script></body></html>',
      'https://jobwebrwanda.com/jobs/x'
    );
    expect(details.emails).toEqual(['careers@echowa.com']);
    expect(details.route).toBe('email');
  });

  it('treats an apply form on the page as the form route', () => {
    const details = extractPostingDetails(
      `<html><body><form method="post"><input type="submit" value="Apply for Job" /></form></body></html>`,
      'https://jobwebrwanda.com/jobs/x'
    );
    expect(details.route).toBe('form');
    expect(details.applyUrls).toContain('https://jobwebrwanda.com/jobs/x');
  });

  it('falls back to a form route when only an application link exists', () => {
    const details = extractPostingDetails('<html><body><a href="/apply">Apply for this job</a></body></html>', 'https://acme.rw/jobs/2');
    expect(details.route).toBe('form');
    expect(details.emails).toEqual([]);
    expect(details.deadline).toBeNull();
  });

  it('falls back to guided steps when the posting has neither', () => {
    const details = extractPostingDetails('<html><body><p>Contact the office.</p></body></html>', 'https://acme.rw/jobs/3');
    expect(details.route).toBe('guided');
  });

  it('marks an unfetched posting with the reason', () => {
    const details = emptyPostingDetails('https://acme.rw/jobs/4', 'blocked');
    expect(details).toMatchObject({ fetched: false, error: 'blocked', route: 'guided' });
  });
});

describe('isSafePublicUrl', () => {
  it('accepts public http(s) pages and rejects local or private hosts', () => {
    expect(isSafePublicUrl('https://jobwebrwanda.com/jobs/x')).toBe(true);
    expect(isSafePublicUrl('http://example.com/apply')).toBe(true);
    expect(isSafePublicUrl('http://localhost:3000/apply')).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1/apply')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.5/apply')).toBe(false);
    expect(isSafePublicUrl('http://172.20.0.1/apply')).toBe(false);
    expect(isSafePublicUrl('http://169.254.169.254/latest')).toBe(false);
    expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);
    expect(isSafePublicUrl('not a url')).toBe(false);
  });
});
