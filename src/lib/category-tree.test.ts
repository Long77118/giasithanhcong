import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { categoryAncestors, categorySubtreeIDs, categoryTreeOptions, type CategoryTreeNode } from './category-tree';
import { Pagination } from '../components/Pagination';

const node = (id: number, parent?: CategoryTreeNode['parent'], status: CategoryTreeNode['status'] = 'published'): CategoryTreeNode => ({id,parent,status});

test('breadcrumb ancestors follow the published parent chain from root to direct parent', () => {
  const root = node(1);
  const parent = node(2, { id: 1 });
  const current = node(3, 2);
  const other = node(4, 1);
  assert.deepEqual(categoryAncestors(current, [other, parent, root, current]), [root, parent]);
  assert.deepEqual(categoryAncestors(current, [root, node(2, 1, 'draft'), current]), []);
  assert.deepEqual(categoryAncestors(current, [parent, current]), [parent]);
  assert.deepEqual(categoryAncestors(current, [node(2, 3), current]), []);
});

test('Subtree includes every published generation and sibling branch, stopping at draft categories', () => {
  const categories = [node(1),node(2,1),node(3,{id:2}),node(4,3),node(5,1),node(6,1,'draft'),node(7,6),node(8)];
  assert.deepEqual(categorySubtreeIDs(1,categories).sort((a,b)=>a-b),[1,2,3,4,5]);
  assert.deepEqual(categorySubtreeIDs(2,categories).sort((a,b)=>a-b),[2,3,4]);
  assert.deepEqual(categorySubtreeIDs(6,categories),[]);
  assert.deepEqual(categorySubtreeIDs(999,categories),[]);
});

test('Legacy category cycles terminate and do not duplicate IDs', () => {
  const categories = [node(1,3),node(2,1),node(3,2),node(4,4),node(5)];
  assert.deepEqual(categorySubtreeIDs(1,categories).sort((a,b)=>a-b),[1,2,3]);
  assert.deepEqual(categorySubtreeIDs(4,categories),[4]);
  const options = categoryTreeOptions(categories);
  assert.equal(options.length,5);
  assert.equal(new Set(options.map(option=>option.category.id)).size,5);
});

test('Category filter options preserve hierarchy, public nodes and input display order', () => {
  const categories = [node(1),node(4,1),node(2,{id:1}),node(3,2),node(8,1,'draft'),node(9,999)];
  assert.deepEqual(categoryTreeOptions(categories).map(({category,depth})=>[category.id,depth]),[[1,0],[4,1],[2,1],[3,2],[9,0]]);
});

test('Wide and deeply nested trees have no artificial descendant limit or recursion overflow', () => {
  const wide = [node(1),...Array.from({length:250},(_,index)=>node(index+2,1))];
  assert.equal(categorySubtreeIDs(1,wide).length,251);
  const deep = Array.from({length:10000},(_,index)=>node(index+1,index===0?null:index));
  assert.equal(categorySubtreeIDs(1,deep).length,10000);
  const options = categoryTreeOptions(deep);
  assert.equal(options.at(-1)?.depth,9999);
});

test('Category and catalog pagination retain active sort, category and search parameters', () => {
  for (const [basePath,queryParams] of [
    ['/danh-muc/cha',{sort:'moq-asc'}],
    ['/san-pham',{sort:'name-asc',category:'cap-chau',q:'PET 500'}],
  ] as const) {
    const html = renderToStaticMarkup(React.createElement(Pagination,{currentPage:2,totalPages:3,basePath,queryParams}));
    const links = [...html.matchAll(/href="([^"]+)"/g)].map(match=>new URL(match[1].replaceAll('&amp;','&'),'https://example.com'));
    assert.ok(links.some(url=>url.searchParams.get('page')==='3'));
    for (const url of links) for (const [key,value] of Object.entries(queryParams)) assert.equal(url.searchParams.get(key),value);
  }
});
