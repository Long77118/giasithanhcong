import test from 'node:test';
import assert from 'node:assert/strict';
import { carouselOffset, readCarouselPosition } from './carousel-position';

test('resizing keeps the same visible category and fraction of its slide', () => {
  const before = [0, 160, 320, 480];
  const after = [0, 200, 400, 600];
  const position = readCarouselPosition(before, 360);
  const resized = carouselOffset(after, position);
  assert.equal(resized, 450);
  assert.deepEqual(readCarouselPosition(after, resized), position);
  assert.equal(carouselOffset(before, readCarouselPosition(after, resized)), 360);
});

test('loop recentering preserves the category in the middle copy across a breakpoint', () => {
  const oldOffsets = Array.from({ length: 15 }, (_, index) => index * 160);
  const newOffsets = Array.from({ length: 15 }, (_, index) => index * 200);
  const position = readCarouselPosition(oldOffsets, 200);
  const middle = { ...position, index: 6 + position.index % 3 };
  assert.equal(carouselOffset(newOffsets, middle), 1450);
});

test('empty, negative and past-the-end offsets stay within available slides', () => {
  assert.deepEqual(readCarouselPosition([], 100), { index: 0, progress: 0 });
  assert.deepEqual(readCarouselPosition([0, 100], -50), { index: 0, progress: 0 });
  assert.deepEqual(readCarouselPosition([0, 100], 900), { index: 1, progress: 0 });
  assert.equal(carouselOffset([], { index: 5, progress: .5 }), 0);
});
