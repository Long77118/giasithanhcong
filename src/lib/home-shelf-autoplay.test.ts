import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoplayHomeShelves } from './home-shelf-autoplay';

const ready = {
  canRotate: true,
  visible: true,
  pageVisible: true,
  reducedMotion: false,
  hovered: false,
  focused: false,
  dragging: false,
  paused: false,
};

test('home shelves autoplay only when every condition allows it', () => {
  assert.equal(shouldAutoplayHomeShelves(ready), true);
  for (const [condition, allowedValue] of Object.entries(ready)) {
    assert.equal(shouldAutoplayHomeShelves({ ...ready, [condition]: !allowedValue }), false, condition);
  }
});

test('manual pause still blocks autoplay after temporary pauses clear', () => {
  const paused = { ...ready, paused: true };
  for (const temporary of [{ hovered: true }, { focused: true }, { dragging: true }, { pageVisible: false }, { visible: false }]) {
    assert.equal(shouldAutoplayHomeShelves({ ...paused, ...temporary }), false);
    assert.equal(shouldAutoplayHomeShelves(paused), false);
  }
  assert.equal(shouldAutoplayHomeShelves({ ...paused, paused: false }), true);
});
