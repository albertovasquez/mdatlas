import { HERE_NOW_API_KEY } from './config.js';

const BASE = 'https://here.now/api/v1';

function authHeaders(extra = {}) {
  return {
    'Authorization': `Bearer ${HERE_NOW_API_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// Publish markdown content as a here.now site via the 3-step flow:
// create → upload to presigned URLs → finalize. Returns the live siteUrl.
// Throws on any failure; callers decide how to surface it.
export async function publishToHereNow(content, { contentType = 'text/markdown; charset=utf-8' } = {}) {
  if (!HERE_NOW_API_KEY) throw new Error('here.now API key not configured');

  const size = Buffer.byteLength(content);

  // Step 1 — create the site, get presigned upload URLs + versionId
  const createRes = await fetch(`${BASE}/publish`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      files: [{ path: 'index.md', size, contentType }],
    }),
  });
  if (!createRes.ok) {
    throw new Error(`publish create failed (${createRes.status}): ${await createRes.text()}`);
  }
  const { slug, siteUrl, upload } = await createRes.json();

  // Step 2 — PUT the content to each presigned upload URL
  for (const u of upload.uploads) {
    const putRes = await fetch(u.url, {
      method: u.method ?? 'PUT',
      headers: u.headers,
      body: content,
    });
    if (!putRes.ok) {
      throw new Error(`upload failed for ${u.path} (${putRes.status})`);
    }
  }

  // Step 3 — finalize the version to make it live
  const finalizeRes = await fetch(`${BASE}/publish/${slug}/finalize`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ versionId: upload.versionId }),
  });
  if (!finalizeRes.ok) {
    throw new Error(`finalize failed (${finalizeRes.status}): ${await finalizeRes.text()}`);
  }

  return siteUrl;
}
