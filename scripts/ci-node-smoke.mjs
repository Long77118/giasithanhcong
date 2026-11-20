import fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
assert.equal(process.env.CI, 'true');
const base = 'http://127.0.0.1:3000';
const log = fs.openSync('.ci/node.log', 'w');
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3000', '-H', '127.0.0.1'], { stdio: ['ignore', log, log] });
try {
  let ready = false;
  for (let i=0; i<60; i++) {
    try { if ((await fetch(base+'/api/health')).ok) { ready=true; break; } } catch {}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert.ok(ready);
  const routes=['/','/san-pham','/san-pham?q=PET','/san-pham?page=2','/danh-muc/ly-coc-dung-mot-lan','/san-pham/ly-nhua-pet-500ml-nap-cau','/blog','/blog/phan-biet-ly-nhua-pet-va-pp-khi-nhap-si','/lien-he','/admin','/robots.txt','/sitemap.xml'];
  for (const route of routes) {
    const response=await fetch(base+route);
    assert.equal(response.status,200,route);
    const html=await response.text();
    if(route==='/')assert.match(html,/noindex/);
    for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs))JSON.parse(match[1]);
  }
  assert.equal((await fetch(base+'/api/users?limit=1')).status,403);
  assert.equal((await fetch(base+'/api/quote-requests?limit=1')).status,403);
  assert.equal((await fetch(base+'/san-pham/hop-ba-mia-2-ngan-noi-bo-draft')).status,404);
  const session=JSON.parse(fs.readFileSync('.ci/session.json'));
  const login=await fetch(base+'/api/users/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:session.email,password:session.password})});
  assert.equal(login.status,200);
  const {token}=await login.json();
  const edit=await fetch(base+'/admin/collections/products/'+session.productId,{headers:{Cookie:'payload-token='+token}});
  assert.equal(edit.status,200);
  console.log('PASS: Original Node runtime, public pages, noindex, JSON-LD, draft/privacy and authenticated admin edit page.');
} catch(error) {
  console.error(String(error));
  console.error(fs.readFileSync('.ci/node.log','utf8').slice(-5000));
  process.exitCode=1;
} finally { server.kill('SIGTERM'); fs.closeSync(log); }
