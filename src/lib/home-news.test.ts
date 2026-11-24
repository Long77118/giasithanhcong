import assert from 'node:assert/strict';
import { test } from 'node:test';
import { homeNewsCategoryTones } from './home-news';
import { homeNewsCoverSizes } from './storefront-image-sizes';

test('Home news category tones are independent of post order and resolve palette collisions', () => {
  const tones = homeNewsCategoryTones([7, 1, 13, 2, 3, 7]);
  assert.deepEqual(tones, homeNewsCategoryTones([1, 2, 3, 7, 13]));
  assert.equal(tones.get(1), homeNewsCategoryTones([1]).get(1));
  assert.equal(tones.size, 5);
  assert.equal(new Set(tones.values()).size, 5);
  assert.equal(homeNewsCategoryTones([]).size, 0);
});

test('Home news cover widths follow the single, split, stacked and two-by-two layouts', () => {
  assert.match(homeNewsCoverSizes(1, 0), /3rem - 2px\) \* \.52/);
  assert.match(homeNewsCoverSizes(2, 0), /1rem\) \/ 2 - 2px/);
  assert.match(homeNewsCoverSizes(2, 1), /1rem\) \/ 2 - 2px.*clamp\(5rem, 26vw, 8rem\)/);
  assert.match(homeNewsCoverSizes(3, 1), /\.48 - 1\.5rem - 2px\) \* \.52/);
  assert.match(homeNewsCoverSizes(4, 1), /\.48 - 1\.5rem - 2px\) \* \.38/);
  assert.match(homeNewsCoverSizes(4, 3), /\(min-width: 40rem\).*1\.5rem - 2px\) \* \.28/);
  assert.match(homeNewsCoverSizes(5, 4), /\.48 - 1rem\) \/ 2 - 2px/);
});
