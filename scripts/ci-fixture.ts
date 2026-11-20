import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { getPayload } from 'payload';
import config from '../src/payload.config';

assert.equal(process.env.CI, 'true');
assert.equal(process.env.SQL_DB_NAME, 'ci_only');
const payload = await getPayload({ config });
const password = crypto.randomBytes(24).toString('hex');
const email = 'ci-admin@example.invalid';
await payload.create({ collection: 'users', overrideAccess: true, data: { name: 'CI Admin', role: 'admin', email, password } });
const products = await payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 1, overrideAccess: true });
const posts = await payload.find({ collection: 'posts', limit: 1, overrideAccess: true });
const { parse } = await import('jsonc-parser');
const wrangler = parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const base = 'http://127.0.0.1:8787';
const proxyToken = crypto.randomBytes(32).toString('hex');
console.log('::add-mask::' + proxyToken);
wrangler.main = path.resolve('cloudflare/worker.ts');
wrangler.assets.directory = path.resolve('.open-next/assets');
wrangler.vars = {
  ...wrangler.vars, APP_URL: base, NEXT_PUBLIC_SITE_URL: base,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  QUOTE_TRUSTED_PROXY_TOKEN: proxyToken,
};
wrangler.hyperdrive[0].localConnectionString = 'postgres://ci_only:ci_only@127.0.0.1:5432/ci_only?sslmode=disable';
fs.mkdirSync('.ci', { recursive: true });
fs.writeFileSync('.ci/wrangler.json', JSON.stringify(wrangler));
fs.writeFileSync('.ci/session.json', JSON.stringify({ email, password, productId: products.docs[0].id, postId: posts.docs[0].id }));
await payload.destroy();
console.log('Created disposable CI Admin and local Worker bindings.');
process.exit(0);
