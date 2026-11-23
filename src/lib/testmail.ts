/**
 * SynqSquad Testmail.app Integration Client
 * Provides automated temporary inbox generation, email reception,
 * and verification for E2E testing, inquiry validation, and system notifications.
 */

export interface TestmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  downloadUrl?: string;
}

export interface TestmailEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  timestamp: number;
  downloadUrl?: string;
  attachments?: TestmailAttachment[];
}

export interface TestmailResponse {
  result: 'success' | 'fail';
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: TestmailEmail[];
}

const TESTMAIL_API_BASE = 'https://api.testmail.app/api/json';

export function getTestmailConfig() {
  const apiKey = process.env.TESTMAIL_API_KEY?.trim();
  const namespace = process.env.TESTMAIL_NAMESPACE?.trim();

  return {
    apiKey,
    namespace,
    isConfigured: Boolean(apiKey && namespace),
  };
}

/**
 * Returns an inbox address for a given dynamic tag under the configured namespace.
 * Format: {namespace}.{tag}@inbox.testmail.app
 */
export function getTestmailInboxAddress(tag: string): string {
  const { namespace, isConfigured } = getTestmailConfig();
  if (!isConfigured || !namespace) {
    throw new Error('Testmail is not configured. Please set TESTMAIL_API_KEY and TESTMAIL_NAMESPACE.');
  }

  // Clean tag to be alphanumeric and underscores/hyphens only
  const sanitizedTag = tag.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `${namespace}.${sanitizedTag}@inbox.testmail.app`;
}

/**
 * Queries testmail.app inbox via REST API.
 */
export async function fetchTestmailEmails(options: {
  tag?: string;
  limit?: number;
} = {}): Promise<TestmailResponse> {
  const { apiKey, namespace, isConfigured } = getTestmailConfig();
  if (!isConfigured || !apiKey || !namespace) {
    throw new Error('Testmail is not configured. Please set TESTMAIL_API_KEY and TESTMAIL_NAMESPACE.');
  }

  const url = new URL(TESTMAIL_API_BASE);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('namespace', namespace);

  if (options.tag) {
    url.searchParams.set('tag', options.tag.toLowerCase());
  }
  if (options.limit) {
    url.searchParams.set('limit', String(options.limit));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Testmail API error: HTTP ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as TestmailResponse;
  return data;
}

/**
 * Actively waits for an email with a specific tag to arrive within a timeout window.
 * Useful for automated CI/CD integration tests verifying transactional emails.
 */
export async function waitForEmail(options: {
  tag: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}): Promise<TestmailEmail | null> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const pollIntervalMs = options.pollIntervalMs ?? 2000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetchTestmailEmails({
        tag: options.tag,
        limit: 1,
      });

      if (response.result === 'success' && response.emails.length > 0) {
        return response.emails[0];
      }
    } catch {
      // transient network or rate error, retry until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return null;
}
