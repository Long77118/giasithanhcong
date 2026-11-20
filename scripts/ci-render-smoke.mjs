import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';

assert.equal(process.env.CI, 'true');
assert.equal(process.env.SQL_DB_NAME, 'ci_only');
assert.equal(process.env.R2_ENDPOINT, 'http://127.0.0.1:5000');

const base = `http://127.0.0.1:${process.env.PORT}`;
const origin = process.env.RENDER_EXTERNAL_URL;
const session = JSON.parse(fs.readFileSync('.ci/session.json', 'utf8'));
const log = fs.openSync('.ci/render.log', 'w');
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '0.0.0.0'], {
  stdio: ['ignore', log, log],
});

async function request(route, options = {}, expected = 200) {
  const url = new URL(route, origin);
  assert.equal(url.origin, origin, `Unexpected public URL: ${route}`);
  const response = await fetch(base + url.pathname + url.search, {
    ...options,
    headers: { Origin: origin, ...options.headers },
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, expected, route);
  assert.match(response.headers.get('x-robots-tag') ?? '', /\bnoindex\b/, route);
  return response;
}

const checksum = bytes => createHash('sha256').update(bytes).digest('hex');

function storedObjectChecksum(filename) {
  return execFileSync('.ci/s3-venv/bin/python', ['-c', `
import hashlib
import os
import sys
import boto3

s3 = boto3.client('s3', endpoint_url=os.environ['R2_ENDPOINT'], region_name='us-east-1',
                  aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
                  aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'])
bucket = os.environ['R2_BUCKET']
keys = [item['Key'] for item in s3.list_objects_v2(Bucket=bucket).get('Contents', [])
        if item['Key'].split('/')[-1] == sys.argv[1]]
assert len(keys) == 1, f'Expected one stored object for {sys.argv[1]}'
print(hashlib.sha256(s3.get_object(Bucket=bucket, Key=keys[0])['Body'].read()).hexdigest())
`, filename], { encoding: 'utf8', timeout: 10000 }).trim();
}

try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      ready = (await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })).ok;
      if (ready) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Next.js did not bind to the Render PORT');

  for (const route of ['/', '/san-pham', '/san-pham?page=2', '/blog', '/lien-he', '/admin/login', '/robots.txt', '/sitemap.xml']) {
    const html = await (await request(route)).text();
    if (route === '/') {
      assert.match(html, /name="robots" content="noindex\b/);
      assert.ok(html.includes(origin), 'SEO should use the Render external URL');
    }
    if (route === '/robots.txt') assert.match(html, /Disallow: \/(?:\s|$)/);
  }
  await request('/api/users?limit=1', {}, 403);
  await request('/api/quote-requests?limit=1', {}, 403);
  await request('/san-pham?page=999999', {}, 404);

  const login = await request('/api/users/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: session.email, password: session.password }),
  });
  const sessionCookie = login.headers.getSetCookie().find(value => value.startsWith('payload-token='));
  assert.ok(sessionCookie, 'Admin login did not return a session cookie');
  assert.match(sessionCookie, /;\s*Secure\b/i);
  assert.match(sessionCookie, /;\s*HttpOnly\b/i);
  const auth = { Cookie: sessionCookie.split(';')[0] };
  const dashboard = await (await request('/admin', { headers: auth })).text();
  assert.match(dashboard, /workspace-dashboard/);
  const productPath = `/api/products/${session.productId}`;
  const edit = await (await request(`/admin/collections/products/${session.productId}`, { headers: auth })).text();
  const original = await (await request(productPath + '?depth=1', { headers: auth })).json();
  assert.ok(edit.includes(original.sku), 'Admin opens the selected product');

  const legacy = original.images[0].image;
  for (const file of [legacy, legacy.sizes.thumbnail]) {
    const response = await request(file.url);
    assert.match(response.headers.get('content-type') ?? '', /^image\//);
    assert.equal(checksum(Buffer.from(await response.arrayBuffer())), checksum(fs.readFileSync(`.ci/seed-media/${file.filename}`)));
  }
  console.log('PASS: login, admin edit page, noindex and original R2 media. Checking upload.');

  const bytes = fs.readFileSync('public/images/home/cups-cutout.webp');
  const form = new FormData();
  form.set('_payload', JSON.stringify({ alt: 'Ảnh kiểm tra Render CI' }));
  form.set('file', new Blob([bytes], { type: 'image/webp' }), 'ci-render-upload.webp');
  await request('/api/media', { method: 'POST', body: form }, 403);
  const { doc: media } = await (await request('/api/media', { method: 'POST', headers: auth, body: form }, 201)).json();
  const stored = await request(media.url);
  assert.match(stored.headers.get('content-type') ?? '', /^image\//);
  const downloaded = Buffer.from(await stored.arrayBuffer());
  assert.equal(downloaded.toString('ascii', 8, 12), 'WEBP');
  assert.equal(checksum(downloaded), storedObjectChecksum(media.filename));
  assert.equal(fs.existsSync(`media/${media.filename}`), false);
  console.log('PASS: upload written to private S3 and served by the app. Checking product edit.');

  const saveProduct = (data) => request(productPath, {
    method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(data),
  });
  const detailPath = `/san-pham/${original.slug}`;
  await request(detailPath);
  const updatedName = 'Sản phẩm kiểm tra Render CI';
  await saveProduct({ name: updatedName, images: [{ image: media.id, alt: 'Ảnh CI' }] });
  const saved = await (await request(productPath + '?depth=1', { headers: auth })).json();
  const galleryImage = saved.images[0].image;
  assert.equal(galleryImage.id, media.id);
  const galleryUrl = galleryImage.sizes?.card?.url || galleryImage.url;
  const updatedHtml = await (await request(detailPath)).text();
  assert.ok(updatedHtml.includes(updatedName), 'CMS update should be visible immediately');
  assert.ok(updatedHtml.includes(galleryUrl), 'Published product should render the uploaded image');
  const galleryResponse = await request(galleryUrl);
  assert.match(galleryResponse.headers.get('content-type') ?? '', /^image\//);
  await galleryResponse.arrayBuffer();

  await saveProduct({ name: original.name, images: original.images.map(({ image, alt }) => ({ image: image.id, alt })) });
  await request(`/api/media/${media.id}`, { method: 'DELETE', headers: auth });
  await request(media.url, {}, 404);
  const anonymous = await fetch(`${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${encodeURIComponent(legacy.filename)}`);
  assert.equal(anonymous.status, 403, 'S3 bucket must reject unauthenticated file reads');
  console.log('PASS: Render PORT, noindex and URL, login cookie, admin product edit, legacy media, private S3 upload/read/delete, and immediate product update.');
} catch (error) {
  console.error(String(error));
  console.error(fs.readFileSync('.ci/render.log', 'utf8').slice(-6500));
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  fs.closeSync(log);
}
