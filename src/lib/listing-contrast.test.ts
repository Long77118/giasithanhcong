import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const stylesheet = readFileSync(new URL('../components/listing.css', import.meta.url), 'utf8');
const colors = new Map([...stylesheet.matchAll(/--listing-([\w-]+):\s*#([\da-f]{6});/gi)]
  .map(([, name, hex]) => [name, hex]));

function luminance(name: string) {
  const hex = colors.get(name);
  assert.ok(hex, `Missing listing color: ${name}`);
  const channels = [0, 2, 4].map(offset => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

test('Listing text and interactive boundaries meet their contrast thresholds', (context) => {
  const textPairs = [
    ['paper', 'brick'], ['paper', 'brick-hover'], ['paper', 'ink'],
    ['ink', 'paper'], ['ink', 'sage'], ['muted', 'paper'], ['muted', 'sage'],
    ['sand-ink', 'sand'], ['brick-hover', 'clay'], ['brick-hover', 'paper'],
  ];
  const controlPairs = [
    ['control-line', 'paper'], ['control-line', 'sage'], ['control-line', 'sand'], ['control-line', 'clay'],
  ];
  for (const [pairs, minimum] of [[textPairs, 4.5], [controlPairs, 3]] as const) {
    for (const [foreground, background] of pairs) {
      const a = luminance(foreground);
      const b = luminance(background);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      context.diagnostic(`${foreground} / ${background}: ${ratio.toFixed(2)}:1`);
      assert.ok(ratio >= minimum, `${foreground} / ${background} must reach ${minimum}:1`);
    }
  }
});
