import assert from 'node:assert/strict';
import { test } from 'node:test';
import { productListingImageSchedule } from './product-listing';

test('Only first-row product photos receive priority at each listing breakpoint', () => {
  assert.deepEqual(productListingImageSchedule(0), { loading: 'eager', fetchPriority: 'high', preloadMedia: undefined });
  for (const [index, width] of [[1, 40], [2, 64], [3, 80]]) {
    assert.deepEqual(productListingImageSchedule(index), {
      loading: 'lazy', fetchPriority: undefined, preloadMedia: `(min-width: ${width}rem)`,
    });
  }
  assert.deepEqual(productListingImageSchedule(4), { loading: 'lazy', fetchPriority: undefined, preloadMedia: undefined });
});
