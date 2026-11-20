import test from 'node:test';
import assert from 'node:assert/strict';
import robots from '../app/robots';
import { buildCatalogSeoDecision, isIndexingAllowed, type SeoEnv } from './seo';

function withEnvironment<T>(env: SeoEnv, run: () => T): T {
  const environment: Record<string, string | undefined> = process.env;
  const keys = ['APP_URL', 'NEXT_PUBLIC_SITE_URL', 'ALLOW_INDEXING', 'NODE_ENV'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) {
      if (env[key] === undefined) delete environment[key];
      else environment[key] = env[key];
    }
    return run();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete environment[key];
      else environment[key] = previous[key];
    }
  }
}

test('Production robots exposes media and pagination while keeping Admin and API restrictions', () => {
  const result = withEnvironment({ APP_URL:'https://giasithanhcong.example/', ALLOW_INDEXING:'true', NODE_ENV:'production' }, robots);
  assert.equal(result.sitemap,'https://giasithanhcong.example/sitemap.xml');
  assert.deepEqual(result.rules,[{userAgent:'*',allow:['/','/api/media/file/','/_next/image'],disallow:['/admin','/admin/*','/api/']}]);
});

test('Local, preview, staging and unset opt-in keep a full robots block without image exceptions', () => {
  for (const env of [
    {APP_URL:'http://localhost:3000',ALLOW_INDEXING:'false'},
    {APP_URL:'http://localhost:3000',ALLOW_INDEXING:'true'},
    {APP_URL:'http://127.0.0.1:3000',ALLOW_INDEXING:'true'},
    {APP_URL:'http://127.0.0.2:3000',ALLOW_INDEXING:'true'},
    {APP_URL:'http://[::1]:3000',ALLOW_INDEXING:'true'},
    {APP_URL:'http://0.0.0.0:3000',ALLOW_INDEXING:'true'},
    {APP_URL:'http://shop.localhost:3000',ALLOW_INDEXING:'true'},
    {APP_URL:'https://ais-dev-abc.run.app',ALLOW_INDEXING:'true'},
    {APP_URL:'https://ais-pre-abc.run.app',ALLOW_INDEXING:'true'},
    {APP_URL:'https://staging.giasithanhcong.example',ALLOW_INDEXING:'false'},
    {APP_URL:'https://giasithanhcong.example'},
    {APP_URL:'https://giasithanhcong.example',ALLOW_INDEXING:'true',NODE_ENV:'development'},
    {APP_URL:'https://giasithanhcong.example',ALLOW_INDEXING:'true',NODE_ENV:'test'},
  ]) {
    const result = withEnvironment(env, robots);
    assert.deepEqual(result,{rules:[{userAgent:'*',disallow:'/'}]},JSON.stringify(env));
  }
});

test('Indexing opt-in rejects malformed/non-HTTP URLs and respects APP_URL priority', () => {
  for (const APP_URL of ['not-a-url','https://','file:///tmp/site','javascript:alert(1)']) {
    assert.equal(isIndexingAllowed({APP_URL,ALLOW_INDEXING:'true',NODE_ENV:'production'}),false);
  }
  assert.equal(isIndexingAllowed({APP_URL:'http://localhost:3000',NEXT_PUBLIC_SITE_URL:'https://giasithanhcong.example',ALLOW_INDEXING:'true'}),false);
  assert.equal(isIndexingAllowed({NEXT_PUBLIC_SITE_URL:'https://giasithanhcong.example',ALLOW_INDEXING:'true',NODE_ENV:'production'}),true);
});

test('Crawlable page 2 keeps self canonical and noindex; search/filter/sort stay noindex', () => {
  for (const basePath of ['/san-pham','/blog','/danh-muc/ly-coc-dung-mot-lan']) {
    for (const indexingAllowed of [true,false]) {
      const base = {basePath,siteUrl:'https://giasithanhcong.example',indexingAllowed};
      const page = buildCatalogSeoDecision({...base,page:2});
      assert.equal(page.canonical,base.siteUrl+basePath+'?page=2');
      assert.equal(page.robotsIndex,false);assert.equal(page.robotsFollow,indexingAllowed);
      for (const filter of [{query:'PET'},{categorySlug:'ly-coc'},{sort:'name-asc'},{sort:'newest'},{query:'PET',sort:'name-asc',page:2}]) {
        const decision = buildCatalogSeoDecision({...base,...filter});
        assert.equal(decision.canonical,base.siteUrl+basePath);
        assert.equal(decision.robotsIndex,false);assert.equal(decision.robotsFollow,indexingAllowed);
      }
      assert.equal(buildCatalogSeoDecision({...base,page:1}).robotsIndex,indexingAllowed);
    }
  }
});
