import fs from 'node:fs';
import { parse } from 'jsonc-parser';

const config = parse(fs.readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const problems = [];
if (config.vars?.ALLOW_INDEXING !== 'false' || config.vars?.DEPLOYMENT_STAGE !== 'staging') problems.push('Staging must keep ALLOW_INDEXING=false and DEPLOYMENT_STAGE=staging.');
if (!config.hyperdrive?.[0]?.id || /^0+$/.test(config.hyperdrive[0].id)) problems.push('Replace the placeholder Hyperdrive ID in wrangler.jsonc.');
let url;
try { url = new URL(config.vars.APP_URL); } catch {}
if (!url || url.protocol !== 'https:' || /YOUR_|localhost/i.test(url.href)) problems.push('Set APP_URL to the actual HTTPS workers.dev URL.');
if (config.vars?.NEXT_PUBLIC_SITE_URL !== config.vars?.APP_URL) problems.push('NEXT_PUBLIC_SITE_URL must match APP_URL.');
if (!config.r2_buckets?.some(bucket => bucket.binding === 'MEDIA_BUCKET')) problems.push('MEDIA_BUCKET R2 binding is missing.');
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Staging configuration is ready. Runtime secrets and database readiness are checked when starting the Worker.');
