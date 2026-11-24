import assert from 'node:assert/strict';
import test from 'node:test';
import { richTextImageLayout, richTextImageSizes } from './rich-text-image-layout';
import { richTextImageLayoutConfig } from './rich-text-image-layout-config';

const { minimumPercent } = richTextImageLayoutConfig.phone;

test('unset or malformed fields render as medium and centered, without wrapping', () => {
  const expected = richTextImageLayout();
  assert.equal(expected.alignment, 'center');
  assert.equal(expected.wrapText, false);
  assert.equal(expected.style['--rich-text-image-width'], '60%');
  assert.equal(expected.style['--rich-text-image-phone-width'], `max(${minimumPercent}%, 60%)`);
  assert.equal(expected.style['--rich-text-image-max-width'], '100%');
  for (const fields of [null, [], 'small', {}, { imageSize: 'constructor', imageAlignment: 'left; color:red', wrapText: true }]) {
    assert.deepEqual(richTextImageLayout(fields), expected);
  }
});

test('valid presets and alignment use controlled values and wrap on either side only', () => {
  for (const [preset, width] of Object.entries(richTextImageLayoutConfig.presets)) {
    assert.equal(richTextImageLayout({ imageSize: preset }).style['--rich-text-image-width'], `${width}%`);
  }
  for (const imageAlignment of ['left', 'right']) {
    assert.equal(richTextImageLayout({ imageAlignment, wrapText: true }).wrapText, true);
    assert.equal(richTextImageLayout({ imageAlignment, wrapText: 'true' }).wrapText, false);
  }
  assert.equal(richTextImageLayout({ imageAlignment: 'center', wrapText: true }).wrapText, false);
});

test('custom values clamp to their unit range and reject non-numeric and unknown values', () => {
  const width = (customWidth: unknown, customWidthUnit: unknown) =>
    richTextImageLayout({ imageSize: 'custom', customWidth, customWidthUnit }).style['--rich-text-image-width'];
  assert.equal(width(4, 'percent'), '10%');
  assert.equal(width(220, 'percent'), '100%');
  assert.equal(width(5, 'px'), '80px');
  assert.equal(width(2200, 'px'), '1600px');
  assert.equal(width(375, 'px'), '375px');
  for (const value of [null, '80', Infinity, NaN, '120px; color:red']) assert.equal(width(value, 'px'), '60%');
  assert.equal(width(80, 'rem'), '60%');
});

test('layout and source-size fallbacks cap the image at its original width', () => {
  const layout = richTextImageLayout({ imageSize: 'custom', customWidth: 900, customWidthUnit: 'px' }, 320);
  assert.equal(layout.style['--rich-text-image-max-width'], 'min(100%, 320px)');
  assert.equal(richTextImageLayout(undefined, Infinity).style['--rich-text-image-max-width'], '100%');
  assert.equal(richTextImageSizes(layout, { phoneWidth: 'calc(100vw - 32px)', width: '800px' }),
    'auto, (width < 40rem) min(calc(100vw - 32px), max(calc(calc(100vw - 32px) * 0.92), 900px), 320px), min(800px, 900px, 320px)');
});

test('responsive source sizes use the content column of each page and preserve breakpoint order', () => {
  const medium = richTextImageLayout({ imageSize: 'medium' }, 1600);
  const blog = richTextImageSizes(medium, {
    phoneWidth: 'calc(100vw - 32px)', width: 'min(52rem, calc(100vw - 48px))',
    mediaWidths: [{ media: '(min-width: 64rem)', width: 'min(52rem, calc(100vw - 22rem))' }],
  });
  const product = richTextImageSizes(medium, { phoneWidth: 'calc(100vw - 72px)', width: 'min(75rem, calc(100vw - 88px))' });
  assert.match(blog, /^auto, \(width < 40rem\).*0\.92.*, \(min-width: 64rem\).*22rem.*0\.6/);
  assert.match(product, /72px.*0\.92.*75rem.*0\.6/);
  assert.doesNotMatch(product, /64rem/);
});
