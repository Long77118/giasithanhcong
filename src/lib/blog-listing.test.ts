import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blogListingCover, blogListingSpan, blogPostsPerPage, formatBlogListingDate } from './blog-listing';

test('The lead and final blog card fill the rows at every desktop and tablet breakpoint', () => {
  assert.equal(blogPostsPerPage, 11);
  for (const columns of [2, 3, 4]) {
    for (let count = 1; count <= blogPostsPerPage; count++) {
      const spans = Array.from({ length: count }, (_, index) => blogListingSpan(count, index, columns));
      assert.equal(spans[0], count === 1 ? columns : 2);
      assert.ok(spans.every(span => span >= 1 && span <= columns));
      assert.equal(spans.reduce((total, span) => total + span, 0) % columns, 0);
      if (count === blogPostsPerPage) assert.equal(spans.reduce((total, span) => total + span, 0), 12);
    }
  }
});

test('Blog source widths account for the single lead, expanded final cards and phone thumbnails', () => {
  const single = blogListingCover(1, 0);
  assert.deepEqual(single.spans, [2, 3, 4]);
  assert.match(single.sizes, /\* \.55/);
  const last = blogListingCover(2, 1);
  assert.deepEqual(last.spans, [2, 1, 2]);
  assert.match(last.sizes, /\* \.42/);
  assert.doesNotMatch(last.sizes.split(', (min-width: 64rem)')[0], /\* \.42/);
  assert.match(last.sizes, /clamp\(4.75rem, 26vw, 7rem\)$/);
  assert.match(blogListingCover(11, 0).sizes, /calc\(100vw - 2rem - 2px\)$/);
});

test('Blog dates follow the existing Vietnamese day/month/year format', () => {
  assert.equal(formatBlogListingDate('2026-11-24T12:00:00'), '24/11/2026');
  assert.equal(formatBlogListingDate('invalid'), '');
  assert.equal(formatBlogListingDate(null), '');
});
