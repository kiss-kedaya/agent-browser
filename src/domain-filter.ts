import type { BrowserContext, Route } from 'playwright-core';

/**
 * Checks whether a hostname matches one of the allowed domain patterns.
 * Patterns support exact match ("example.com") and wildcard prefix ("*.example.com").
 */
export function isDomainAllowed(hostname: string, allowedDomains: string[]): boolean {
  for (const pattern of allowedDomains) {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // ".example.com"
      if (hostname === pattern.slice(2) || hostname.endsWith(suffix)) {
        return true;
      }
    } else if (hostname === pattern) {
      return true;
    }
  }
  return false;
}

export function parseDomainList(raw: string): string[] {
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
}

/**
 * Installs a context-level route that blocks navigation to domains not in the allowlist.
 * Only document requests (page navigations) are blocked; sub-resources are allowed
 * so pages that are already loaded continue to function.
 */
export async function installDomainFilter(
  context: BrowserContext,
  allowedDomains: string[]
): Promise<void> {
  if (allowedDomains.length === 0) return;

  await context.route('**/*', async (route: Route) => {
    const request = route.request();
    if (request.resourceType() !== 'document') {
      await route.continue();
      return;
    }

    let hostname: string;
    try {
      hostname = new URL(request.url()).hostname.toLowerCase();
    } catch {
      await route.continue();
      return;
    }

    if (isDomainAllowed(hostname, allowedDomains)) {
      await route.continue();
    } else {
      await route.abort('blockedbyclient');
    }
  });
}
