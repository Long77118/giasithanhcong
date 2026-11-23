import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProductCategory } from '@/payload-types';
import { resolveHomeCategoryShelves, shelfPages } from './home-category-shelves';

const category = (id: number, extra: Partial<ProductCategory> = {}): ProductCategory => ({
  id, name: `Danh mục ${id}`, slug: `danh-muc-${id}`, status: 'published', createdAt: '', updatedAt: '', ...extra,
});

test('shelves default to three published roots, and the master switch can hide all', () => {
  const categories = [category(1), category(2, { parent: 1 }), category(3, { status: 'draft' }), category(4), category(5), category(6)];
  assert.deepEqual(resolveHomeCategoryShelves(null, categories).map(row => row.category.id), [1, 4, 5]);
  assert.deepEqual(resolveHomeCategoryShelves({ homeCategoryShelvesEnabled: false }, categories), []);
});

test('configured shelves preserve order and title, deduplicate categories, and reject missing or draft targets', () => {
  const rows = resolveHomeCategoryShelves({ homeCategoryShelves: [
    { category: { id: 2 }, title: '  Ly cho quán  ' }, { category: 1 }, { category: 2 },
    { category: 3 }, { category: 999 }, { category: 4, enabled: false },
  ] }, [category(1), category(2), category(3, { status: 'draft' }), category(4)]);
  assert.deepEqual(rows.map(row => [row.category.id, row.title]), [[2, 'Ly cho quán'], [1, 'Danh mục 1']]);
});

test('explicitly disabled shelves do not reappear through automatic defaults', () => {
  assert.deepEqual(resolveHomeCategoryShelves({ homeCategoryShelves: [{ category: 1, enabled: false }] }, [category(1)]), []);
});

test('four-product shelves rotate every row while keeping four distinct products in each slide', () => {
  assert.deepEqual(shelfPages([1, 2, 3, 4]), [[1, 2, 3, 4], [2, 3, 4, 1], [3, 4, 1, 2], [4, 1, 2, 3]]);
});

test('larger shelves fill four rows without losing products or duplicating an item within a slide', () => {
  assert.deepEqual(shelfPages([]), []);
  assert.deepEqual(shelfPages([1, 2]), [[1, 2]]);
  assert.deepEqual(shelfPages([1, 2, 3]), [[1, 2, 3]]);
  for (let count = 5; count <= 12; count++) {
    const items = Array.from({ length: count }, (_, index) => index);
    const pages = shelfPages(items);
    assert.deepEqual([...new Set(pages.flat())].sort((a, b) => a - b), items);
    assert(pages.every(page => page.length === 4 && new Set(page).size === 4));
    assert(pages.flat().length <= count + 3);
  }
  const products = Array.from({ length: 12 }, (_, index) => index);
  assert.deepEqual(shelfPages(products).flat(), products);
});
