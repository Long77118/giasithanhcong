import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveContactConfig } from './contact';
import { getHeaderContact, groupHeaderCategories, isHeaderLinkCurrent, splitHeaderBrand } from './header';

test('header separates the company prefix without losing a brand with no prefix or no remaining name', () => {
  assert.deepEqual(splitHeaderBrand(' Công Ty Lê Thanh '), { prefix: 'Công Ty', name: 'Lê Thanh' });
  assert.deepEqual(splitHeaderBrand('công ty Bao Bì Việt'), { prefix: 'công ty', name: 'Bao Bì Việt' });
  assert.deepEqual(splitHeaderBrand('Bao Bì An Phát'), { prefix: null, name: 'Bao Bì An Phát' });
  assert.deepEqual(splitHeaderBrand('Công Ty'), { prefix: null, name: 'Công Ty' });
});

test('header marks nested content and categories without matching unrelated URL prefixes', () => {
  assert.equal(isHeaderLinkCurrent('/blog/cach-chon-ly', '/blog'), true);
  assert.equal(isHeaderLinkCurrent('/san-pham/ly-pet', '/san-pham'), true);
  assert.equal(isHeaderLinkCurrent('/danh-muc/ly', '/san-pham'), true);
  assert.equal(isHeaderLinkCurrent('/blogger', '/blog'), false);
  assert.equal(isHeaderLinkCurrent('/san-pham-khac', '/san-pham'), false);
  assert.equal(isHeaderLinkCurrent('/', '/san-pham'), false);
});

test('header retains two valid configured phone links, deduplicates and hides missing contact details', () => {
  const empty = getHeaderContact(resolveContactConfig({ secondaryHotline: 'abc', email: ' ' }));
  assert.deepEqual(empty.phones, []);
  assert.equal(empty.email, null);
  assert.equal(empty.quoteHref, '/lien-he#bao-gia');
  assert.equal(empty.quoteExternal, false);
  const configured = getHeaderContact(resolveContactConfig({
    hotline: '0900 111 222', secondaryHotline: '028 3333 4444', email: ' sales@example.com ', zaloUrl: 'https://zalo.me/0900111222',
  }));
  assert.deepEqual(configured.phones, [{ label: '0900 111 222', href: 'tel:0900111222' }, { label: '028 3333 4444', href: 'tel:02833334444' }]);
  assert.equal(configured.email, 'sales@example.com');
  assert.equal(configured.quoteHref, 'https://zalo.me/0900111222');
  assert.equal(configured.quoteExternal, true);
  assert.equal(getHeaderContact(resolveContactConfig({ hotline: '0900 111 222', secondaryHotline: '0900111222' })).phones.length, 1);
});

test('header category tiles show at most three immediate children and ignore orphaned depth entries', () => {
  const groups = groupHeaderCategories([
    { id: 99, depth: 1 }, { id: 1, depth: 0 }, { id: 2, depth: 1 }, { id: 3, depth: 2 },
    { id: 4, depth: 1 }, { id: 5, depth: 1 }, { id: 6, depth: 1 }, { id: 7, depth: 0 },
  ]);
  assert.deepEqual(groups.map(group => [group.root.id, group.children.map(child => child.id)]), [[1, [2, 4, 5]], [7, []]]);
  assert.deepEqual(groupHeaderCategories([]), []);
});
