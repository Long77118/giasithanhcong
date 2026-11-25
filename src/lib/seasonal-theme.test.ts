import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getChristmasCountdown,
  getSeasonalAnnouncementIdentity,
  getSeasonalScheduleError,
  getSnowParticleCount,
  normalizeSeasonalAnnouncementHref,
  resolveSeasonalTheme,
} from './seasonal-theme';

const december = new Date('2026-12-15T12:00:00Z');
const christmas = { enabled: true, theme: 'christmas' };

test('missing, disabled or unsupported configuration leaves the season off', () => {
  assert.equal(resolveSeasonalTheme(null, december), null);
  assert.equal(resolveSeasonalTheme({ theme: 'christmas' }, december), null);
  assert.equal(resolveSeasonalTheme({ enabled: false, theme: 'christmas' }, december), null);
  assert.equal(resolveSeasonalTheme({ enabled: true, theme: 'other' }, december), null);
  assert.equal(resolveSeasonalTheme(christmas, new Date(NaN)), null);
});

test('the Vietnamese calendar includes the first and last instant of a one-day season', () => {
  const schedule = { ...christmas, startsOn: '2026-12-25', endsOn: '2026-12-25' };
  assert.equal(resolveSeasonalTheme(schedule, new Date('2026-12-24T16:59:59.999Z')), null);
  assert.equal(resolveSeasonalTheme(schedule, new Date('2026-12-24T17:00:00.000Z'))?.theme, 'christmas');
  assert.equal(resolveSeasonalTheme(schedule, new Date('2026-12-25T16:59:59.999Z'))?.expiresAt, Date.parse('2026-12-25T17:00:00Z'));
  assert.equal(resolveSeasonalTheme(schedule, new Date('2026-12-25T17:00:00.000Z')), null);
});

test('each date bound is optional and a Vietnamese season can span New Year', () => {
  assert.equal(resolveSeasonalTheme({ ...christmas, startsOn: '', endsOn: null }, december)?.expiresAt, null);
  assert.equal(resolveSeasonalTheme({ ...christmas, startsOn: '2026-12-16' }, december), null);
  assert.equal(resolveSeasonalTheme({ ...christmas, endsOn: '2026-12-14' }, december), null);
  assert.equal(resolveSeasonalTheme({ ...christmas, endsOn: '2026-12-20' }, december)?.theme, 'christmas');
  const schedule = { ...christmas, startsOn: '2026-12-24', endsOn: '2027-01-01' };
  assert.equal(resolveSeasonalTheme(schedule, new Date('2026-12-31T17:00:00Z'))?.theme, 'christmas');
  assert.equal(resolveSeasonalTheme(schedule, new Date('2027-01-01T17:00:00Z')), null);
});

test('calendar validation rejects impossible, malformed and reversed dates', () => {
  for (const startsOn of ['2026-02-29', '2026-04-31', '2026-2-01', '2026-01-01T00:00:00Z', '0000-12-01']) {
    assert.equal(getSeasonalScheduleError({ startsOn })?.field, 'startsOn');
    assert.equal(resolveSeasonalTheme({ ...christmas, startsOn }, december), null);
  }
  assert.equal(getSeasonalScheduleError({ startsOn: '2028-02-29' }), null);
  assert.equal(getSeasonalScheduleError({ endsOn: '2026-13-01' })?.field, 'endsOn');
  assert.equal(getSeasonalScheduleError({ startsOn: '2026-12-26', endsOn: '2026-12-25' })?.field, 'endsOn');
});

test('the resolved theme has safe defaults and honors individual switches', () => {
  assert.deepEqual(resolveSeasonalTheme(christmas, december), {
    theme: 'christmas', expiresAt: null, intensity: 'light',
    snow: true, lights: true, decorations: true, scrollEffects: true, announcement: null,
  });
  assert.deepEqual(resolveSeasonalTheme({
    ...christmas, intensity: 'strong', snowEnabled: false, lightsEnabled: false,
    decorationsEnabled: false, scrollEffectsEnabled: false,
    announcementEnabled: true, announcementText: '  Giáng sinh an lành  ', announcementHref: ' /san-pham ',
  }, december), {
    theme: 'christmas', expiresAt: null, intensity: 'strong',
    snow: false, lights: false, decorations: false, scrollEffects: false,
    announcement: { text: 'Giáng sinh an lành', href: '/san-pham' },
  });
  for (const announcementText of ['', '   ', 'x'.repeat(101)]) {
    assert.equal(resolveSeasonalTheme({ ...christmas, announcementEnabled: true, announcementText }, december)?.announcement, null);
  }
});

test('announcement links accept internal paths and HTTPS without credentials', () => {
  assert.equal(normalizeSeasonalAnnouncementHref(' /san-pham?q=ly '), '/san-pham?q=ly');
  assert.equal(normalizeSeasonalAnnouncementHref('https://example.com/thong-bao'), 'https://example.com/thong-bao');
  for (const href of ['//example.com', '/\\example.com', '#bao-gia', 'javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', 'https://']) {
    assert.equal(normalizeSeasonalAnnouncementHref(href), undefined);
  }
});

test('snow counts scale with intensity and viewport size and are capped on large displays', () => {
  assert.equal(getSnowParticleCount('light', 1440, 900), 26);
  assert.equal(getSnowParticleCount('medium', 1440, 900), 44);
  assert.equal(getSnowParticleCount('strong', 1440, 900), 64);
  assert.equal(getSnowParticleCount('strong', 390, 844), getSnowParticleCount('strong', 640, 500) / 2);
  assert.equal(getSnowParticleCount('strong', 3840, 2160), 80);
  assert.equal(getSnowParticleCount('light', 0, 900), 0);
  assert.equal(getSnowParticleCount('light', 1440, NaN), 0);
});

test('Christmas countdown runs until midnight in Vietnam and rounds the last second up', () => {
  const deadline = Date.parse('2026-12-25T17:00:00Z');
  assert.deepEqual(getChristmasCountdown(new Date('2026-12-24T15:57:56Z')), {
    deadline, days: 1, hours: 1, minutes: 2, seconds: 4,
  });
  assert.equal(getChristmasCountdown(new Date(deadline - 1))?.seconds, 1);
  assert.equal(getChristmasCountdown(new Date(deadline)), null);
  assert.equal(getChristmasCountdown(new Date(NaN)), null);
});

test('the next countdown begins when the Vietnamese calendar year changes', () => {
  assert.equal(getChristmasCountdown(new Date('2026-12-31T16:59:59.999Z')), null);
  assert.equal(getChristmasCountdown(new Date('2026-12-31T17:00:00.000Z'))?.deadline, Date.parse('2027-12-25T17:00:00Z'));
});

test('an announcement dismissal is scoped to its text, link and year in Vietnam', () => {
  const notice = { text: 'Chúc bạn Giáng sinh an lành', href: '/san-pham' };
  const beforeNewYear = new Date('2026-12-31T16:59:59.999Z');
  const afterNewYear = new Date('2026-12-31T17:00:00.000Z');
  const identity = getSeasonalAnnouncementIdentity(notice, beforeNewYear);
  assert.equal(getSeasonalAnnouncementIdentity(notice, december), identity);
  assert.notEqual(getSeasonalAnnouncementIdentity({ ...notice, href: '/lien-he' }, beforeNewYear), identity);
  assert.notEqual(getSeasonalAnnouncementIdentity({ text: notice.text }, beforeNewYear), identity);
  assert.notEqual(getSeasonalAnnouncementIdentity({ ...notice, text: 'Thông báo khác' }, beforeNewYear), identity);
  assert.notEqual(getSeasonalAnnouncementIdentity(notice, afterNewYear), identity);
});
