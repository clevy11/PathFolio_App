const BLOCKED_HOST = /^(localhost|0\.0\.0\.0|\[?::1\]?|.*\.local|.*\.internal)$/i;
const PRIVATE_IPV4 = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** Only public http(s) pages may be fetched: job links are user-supplied. */
export function isSafePublicUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOST.test(host)) return false;
  if (PRIVATE_IPV4.test(host)) return false;
  return true;
}

export interface FetchedPosting {
  ok: boolean;
  html: string;
  error?: string;
}

export async function fetchPostingPage(url: string): Promise<FetchedPosting> {
  if (!isSafePublicUrl(url)) {
    return { ok: false, html: '', error: 'That job link is not a public http(s) page.' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Pathfolio/0.1 (+application preparation)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      return { ok: false, html: '', error: `The posting page returned ${response.status}.` };
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('xml')) {
      return { ok: false, html: '', error: 'The job link is not an HTML posting page.' };
    }
    return { ok: true, html: (await response.text()).slice(0, 500_000) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, html: '', error: `Could not open the posting: ${message.slice(0, 120)}` };
  }
}
