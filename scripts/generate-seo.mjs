import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import './load-env.mjs';

const dist = path.resolve('dist');
const configuredUrl = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
const indexNowKey = process.env.INDEXNOW_KEY;

if (indexNowKey && !/^[A-Za-z0-9-]{8,128}$/.test(indexNowKey)) {
  throw new Error('INDEXNOW_KEY must be 8–128 letters, numbers, or dashes.');
}

function productionOrigin(value) {
  if (!value || value === 'MY_APP_URL') return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const origin = productionOrigin(configuredUrl);
for (const [file, route] of [['index.html', '/'], ['about.html', '/about.html']]) {
  const filePath = path.join(dist, file);
  const html = await readFile(filePath, 'utf8');
  const canonical = origin
    ? `<link rel="canonical" href="${origin}${route}" />\n    <meta property="og:url" content="${origin}${route}" />`
    : '';
  const websiteSchema = origin && file === 'index.html'
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Neon Pulsar: Zero-G Arena',
        alternateName: 'Neon Pulsar',
        url: `${origin}/`,
        author: { '@type': 'Person', name: 'Aarti S Ravikumar', url: 'https://ai-aarti.com/' },
      })}</script>`
    : '';
  const cleaned = html
    .replace('<!-- SEO_CANONICAL -->', canonical)
    .replace('<!-- SEO_WEBSITE_SCHEMA -->', websiteSchema)
    .replace(!origin && file === 'index.html' ? /\s*<link rel="sitemap"[^>]*>/ : /$^/, '');
  await writeFile(filePath, cleaned);
}

if (origin) {
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc></url>\n  <url><loc>${origin}/about.html</loc></url>\n</urlset>\n`);
  await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  console.log(`SEO metadata generated for ${origin}`);
} else {
  console.warn('SITE_URL or VERCEL_PROJECT_PRODUCTION_URL is unset; canonical URLs and sitemap were omitted.');
}

if (indexNowKey) {
  await writeFile(path.join(dist, `${indexNowKey}.txt`), indexNowKey, 'utf8');
  console.log('IndexNow verification file generated.');
}
