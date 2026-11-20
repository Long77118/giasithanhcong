import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
assert.equal(process.env.CI, 'true');
const session = JSON.parse(fs.readFileSync('.ci/session.json'));
const config = JSON.parse(fs.readFileSync('.ci/wrangler.json'));
const base = 'http://127.0.0.1:8787';
const cli = 'node_modules/wrangler/bin/wrangler.js';
const persist = path.resolve('.ci/state');
const configFile = path.resolve('.ci/wrangler.json');
const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };
// Populate the same local R2 storage that the Worker will read, including existing variants.
for (const name of fs.readdirSync('media')) {
  if (!mime[path.extname(name)]) continue;
  execFileSync(process.execPath, [cli, 'r2', 'object', 'put', config.r2_buckets[0].bucket_name + '/' + name,
    '--file', path.resolve('media', name), '--content-type', mime[path.extname(name)], '--local', '--persist-to', persist, '--config', configFile], { stdio: 'pipe' });
}
const logFile = fs.openSync('.ci/worker.log', 'w');
const worker = spawn(process.execPath, [cli, 'dev', '--local', '--port', '8787', '--persist-to', persist, '--config', configFile], {
  stdio: ['ignore', logFile, logFile], env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
});
const evidence = { routes: [], admin: false, r2UploadReadDelete: false, freshCmsContent: false, rateLimit: false };
async function request(route, options = {}, expected = 200) {
  const url = new URL(route, base);
  assert.equal(url.origin, base);
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  if (response.status !== expected) {
    console.error('Unexpected response', route, response.status, (await response.text()).slice(0, 600));
    throw Error('HTTP check failed: ' + route);
  }
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
  return response;
}
try {
  let ready = false;
  for (let i = 0; i < 180; i++) {
    try { if ((await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Worker did not start');
  const routes = ['/', '/san-pham', '/san-pham?q=PET', '/san-pham?page=2', '/danh-muc/ly-coc-dung-mot-lan',
    '/san-pham/ly-nhua-pet-500ml-nap-cau', '/blog', '/blog/phan-biet-ly-nhua-pet-va-pp-khi-nhap-si', '/lien-he', '/admin', '/robots.txt', '/sitemap.xml'];
  for (const route of routes) {
    const response = await request(route);
    const html = await response.text();
    if (route === '/robots.txt') assert.match(html, /Disallow: \/(?:\s|$)/);
    if (route === '/') assert.match(html, /noindex/);
    evidence.routes.push(route);
  }
  await request('/san-pham/hop-ba-mia-2-ngan-noi-bo-draft', {}, 404);
  await request('/san-pham?page=999999', {}, 404);
  await request('/api/users?limit=1', {}, 403);
  await request('/api/quote-requests?limit=1', {}, 403);
  const login = await request('/api/users/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: session.email, password: session.password }) });
  assert.match(login.headers.get('set-cookie') ?? '', /Secure/i);
  const { token } = await login.json();
  assert.ok(token);
  console.log('::add-mask::' + token);
  const auth = { authorization: 'JWT ' + token };
  const cookie = { Cookie: 'payload-token=' + token };
  const editPage = await request('/admin/collections/products/' + session.productId, { headers: cookie });
  assert.ok((await editPage.text()).length > 1000);
  await request('/admin/collections/posts/' + session.postId, { headers: cookie });
  evidence.admin = true;
  const products = await (await request('/api/products?limit=1')).json();
  const published = products.docs[0];
  const original = await request(published.images[0].image.url);
  assert.match(original.headers.get('content-type') ?? '', /^image\//);
  const form = new FormData();
  form.set('_payload', JSON.stringify({ alt: 'CI R2 upload test' }));
  form.set('file', new Blob([fs.readFileSync('public/images/home/cups-cutout.webp')], { type: 'image/webp' }), 'ci-r2.webp');
  const upload = await (await request('/api/media', { method: 'POST', headers: auth, body: form }, 201)).json();
  const media = upload.doc;
  const stored = await request(media.url);
  assert.match(stored.headers.get('content-type') ?? '', /^image\//);
  const oldProduct = await (await request('/api/products/' + session.productId, { headers: auth })).json();
  const updatedName = 'CI Worker product changed';
  await request('/api/products/' + session.productId, { method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ name: updatedName, images: [{ image: media.id, alt: 'CI upload' }] }) });
  assert.ok((await (await request('/san-pham/' + oldProduct.slug)).text()).includes(updatedName));
  await request('/api/products/' + session.productId, { method: 'PATCH', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ name: oldProduct.name, images: oldProduct.images.map(({image,alt})=>({image:typeof image==='object'?image.id:image,alt})) }) });
  await request('/api/media/' + media.id, { method: 'DELETE', headers: auth });
  await request(media.url, {}, 404);
  evidence.r2UploadReadDelete = true;
  evidence.freshCmsContent = true;
  const quote = { customerName: 'CI quote test', phone: '0900000123', quantity: '1000', message: 'CI only', website: '', formLoadedAt: Date.now() - 5000 };
  // The Worker replaces forged internal proxy headers using CF-Connecting-IP.
  for (let i = 0; i < 6; i++) {
    const response = await request('/api/bao-gia', { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.8', 'x-quote-client-ip': '192.0.2.' + i, 'x-quote-proxy-token': 'forged' }, body: JSON.stringify(quote) }, i < 5 ? 201 : 429);
    if (i === 5) assert.ok(Number(response.headers.get('Retry-After')) > 0);
  }
  evidence.rateLimit = true;
  fs.writeFileSync('.ci/results.json', JSON.stringify(evidence, null, 2));
  console.log('PASS: Worker public pages, noindex, admin login/edit pages, R2 upload/read/delete, immediate CMS updates, draft/privacy/404 checks and shared PostgreSQL rate limits.');
} catch (error) {
  console.error(String(error));
  console.error(fs.readFileSync('.ci/worker.log', 'utf8').slice(-12000));
  process.exitCode = 1;
} finally {
  worker.kill('SIGTERM');
  fs.closeSync(logFile);
}
