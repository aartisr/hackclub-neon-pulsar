import assert from 'node:assert/strict';
import { test } from 'node:test';
import { batches, main, parseSitemapUrls } from './submit-indexnow.mjs';

test('sitemap URLs are deduplicated and confined to the production origin', () => {
  const xml = '<urlset><url><loc>https://example.org/</loc></url><url><loc>https://example.org/about.html</loc></url><url><loc>https://example.org/</loc></url></urlset>';
  assert.deepEqual(parseSitemapUrls(xml, 'https://example.org'), ['https://example.org/', 'https://example.org/about.html']);
  assert.throws(() => parseSitemapUrls('<urlset><url><loc>https://other.org/</loc></url></urlset>', 'https://example.org'));
  assert.deepEqual(batches([1, 2, 3], 2), [[1, 2], [3]]);
});

test('submission verifies the deployed key and sends the complete live sitemap', async () => {
  const originalFetch = globalThis.fetch;
  const originalSite = process.env.SITE_URL;
  const originalKey = process.env.INDEXNOW_KEY;
  const key = 'abc12345def67890';
  const requests = [];
  process.env.SITE_URL = 'https://example.org';
  process.env.INDEXNOW_KEY = key;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url === 'https://example.org/sitemap.xml') {
      return { ok: true, status: 200, text: async () => '<urlset><url><loc>https://example.org/</loc></url><url><loc>https://example.org/about.html</loc></url></urlset>' };
    }
    if (url === `https://example.org/${key}.txt`) return { ok: true, status: 200, text: async () => key };
    return { ok: true, status: 200, text: async () => '' };
  };
  try {
    await main();
    assert.equal(requests.length, 3);
    assert.equal(requests[2].url, 'https://api.indexnow.org/indexnow');
    assert.deepEqual(JSON.parse(requests[2].options.body), {
      host: 'example.org', key,
      keyLocation: `https://example.org/${key}.txt`,
      urlList: ['https://example.org/', 'https://example.org/about.html'],
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSite === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSite;
    if (originalKey === undefined) delete process.env.INDEXNOW_KEY;
    else process.env.INDEXNOW_KEY = originalKey;
  }
});
