import assert from 'node:assert/strict';
import test from 'node:test';
import { adminLoginGreeting, dashboardListHref, getDashboardFilters } from './admin-dashboard';

test('dashboard waiting quotes are still new and older than 24 hours', () => {
  const filters = getDashboardFilters(new Date('2026-11-23T05:15:00Z'));
  const href = new URL(dashboardListHref('/admin', 'quote-requests', filters.waitingQuotes), 'https://example.test');
  assert.equal(href.pathname, '/admin/collections/quote-requests');
  assert.equal(href.searchParams.get('where[and][0][status][equals]'), 'new');
  assert.equal(href.searchParams.get('where[and][1][createdAt][less_than]'), '2026-11-22T05:15:00.000Z');
});

test('dashboard list links preserve false and empty values used to find incomplete products', () => {
  const filters = getDashboardFilters(new Date(0));
  const query = (filter: typeof filters.missingImages | typeof filters.missingSeoDescription) =>
    new URL(dashboardListHref('/quan-tri', 'products', filter), 'https://example.test').searchParams;
  assert.equal(query(filters.missingImages).get('where[images.image][exists]'), 'false');
  assert.equal(query(filters.missingSeoDescription).get('where[or][0][meta.description][exists]'), 'false');
  assert.equal(query(filters.missingSeoDescription).get('where[or][1][meta.description][equals]'), '');
});

test('login greeting changes at the three local time boundaries', () => {
  assert.equal(adminLoginGreeting(0), 'Chào buổi sáng!');
  assert.equal(adminLoginGreeting(10), 'Chào buổi sáng!');
  assert.equal(adminLoginGreeting(11), 'Chào buổi trưa!');
  assert.equal(adminLoginGreeting(14), 'Chào buổi chiều!');
  assert.equal(adminLoginGreeting(18), 'Chào buổi tối!');
});
