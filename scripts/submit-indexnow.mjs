import './load-env.mjs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const endpoint = 'https://api.indexnow.org/indexnow';
const keyPattern = /^[A-Za-z0-9-]{8,128}$/;

export function parseSitemapUrls(xml, origin) {
  if (/<sitemapindex\b/i.test(xml)) throw new Error('Sitemap indexes are not supported; use the site URL sitemap.');
  const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/gi)];
  const urls = entries.map(([, loc]) => {
    const decoded = loc.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    const url = new URL(decoded);
    if (url.origin !== origin) throw new Error(`Sitemap URL is outside ${origin}: ${url.href}`);
    return url.href;
  });
  if (!urls.length) throw new Error('No page URLs found in the live sitemap.');
  return [...new Set(urls)];
}

export function batches(items, size = 10000) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

async function getText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

export async function main() {
  const configured = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) throw new Error('Set SITE_URL to the public production origin.');
  const site = new URL(/^https?:\/\//i.test(configured) ? configured : `https://${configured}`);
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash) {
    throw new Error('SITE_URL must be an HTTPS production origin, without a path or query.');
  }
  const origin = site.origin;
  const dryRun = process.argv.includes('--dry-run');
  const urls = parseSitemapUrls(await getText(`${origin}/sitemap.xml`), origin);

  if (dryRun) {
    console.log(`Would submit ${urls.length} URL(s) to IndexNow:`);
    urls.forEach(url => console.log(url));
    return;
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key || !keyPattern.test(key)) throw new Error('Set a valid INDEXNOW_KEY (8–128 letters, numbers, or dashes).');
  const keyLocation = `${origin}/${key}.txt`;
  if ((await getText(keyLocation)).trim() !== key) {
    throw new Error('The deployed IndexNow key file does not contain INDEXNOW_KEY. Rebuild and deploy with the same key.');
  }

  for (const batch of batches(urls)) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: site.host, key, keyLocation, urlList: batch }),
      signal: AbortSignal.timeout(15000),
    });
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`IndexNow rejected a batch of ${batch.length} URL(s): HTTP ${response.status}.`);
    }
    console.log(`IndexNow ${response.status === 202 ? 'accepted for key validation' : 'received'} ${batch.length} URL(s).`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
