import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/admin/styles/_tokens.scss', import.meta.url), 'utf8');

function readPalette(selector) {
  const block = css.split(`${selector} {`)[1]?.split('}')[0];
  if (!block) throw new Error(`Missing palette: ${selector}`);
  return Object.fromEntries([...block.matchAll(/--workspace-([\w-]+): (#[\da-f]+);/gi)]
    .map(([, name, color]) => [name, color]));
}

function luminance(color) {
  if (!color || !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) throw new Error(`Unsupported contrast color: ${color}`);
  const hex = color.length === 4 ? [...color.slice(1)].map(digit => digit.repeat(2)).join('') : color.slice(1);
  const [r, g, b] = hex.match(/../g).map(channel => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const checks = [
  ...['canvas', 'surface', 'side', 'soft'].flatMap(background => [
    ['ink', background, 4.5], ['muted', background, 4.5], ['ring', background, 3],
  ]),
  ...['canvas', 'surface'].map(background => ['control-line', background, 3]),
  ...['canvas', 'surface', 'soft'].map(background => ['accent', background, 4.5]),
  ...['primary', 'primary-hover'].map(background => ['primary-ink', background, 4.5]),
  ['hero-text', 'hero', 4.5],
  ['primary', 'soft', 3],
  ...['error', 'warning', 'success', 'info'].map(state => [`${state}-ink`, `${state}-bg`, 4.5]),
  ...['coral', 'sun', 'lavender', 'mint'].map(background => ['sticker-ink', background, 4.5]),
];

const light = readPalette(':root');
const themes = { light, dark: { ...light, ...readPalette(":root[data-theme='dark']") } };

const results = Object.entries(themes).flatMap(([theme, palette]) => checks.map(([foreground, background, minimum]) => {
  const lightness = [luminance(palette[foreground]), luminance(palette[background])].sort((a, b) => b - a);
  const ratio = (lightness[0] + 0.05) / (lightness[1] + 0.05);
  return { theme, pair: `${foreground} / ${background}`, ratio: ratio.toFixed(2), minimum, pass: ratio >= minimum };
}));

console.table(results);
const failures = results.filter(({ pass }) => !pass).length;
console.log(`${results.length - failures}/${results.length} contrast checks passed.`);
if (failures) process.exitCode = 1;
