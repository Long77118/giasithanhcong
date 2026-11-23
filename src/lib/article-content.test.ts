import test from 'node:test';
import assert from 'node:assert/strict';
import { articleHeadingSlug, articleReadingMinutes, extractArticleHeadings } from './article-content';

const text = (value: string) => ({ type: 'text', text: value });
const heading = (tag: string, value: string) => ({ type: 'heading', tag, children: [text(value)] });
const document = (...children: unknown[]) => ({ root: { children } });

test('heading slugs normalize Vietnamese accents and use separators for punctuation', () => {
  assert.equal(articleHeadingSlug('  Đóng gói: Ly/Cốc — 500 ml! '), 'dong-goi-ly-coc-500-ml');
  assert.equal(articleHeadingSlug('***'), 'muc');
});

test('article headings preserve document order, inline wording and stable unique IDs', () => {
  const input = document(
    heading('h1', 'Trang'),
    heading('h2', 'Đóng gói'),
    { type: 'heading', tag: 'h3', children: [text('Đóng '), { type: 'link', children: [text('gói')] }] },
    heading('h2', 'Đóng gói 2'),
    heading('h2', 'Đóng gói'),
    heading('h3', '  '),
    { type: 'paragraph', children: [heading('h2', 'Bên trong')] },
  );
  assert.deepEqual(extractArticleHeadings(input), [
    { id: 'bai-viet-dong-goi', text: 'Đóng gói', level: 2, index: 1 },
    { id: 'bai-viet-dong-goi-2', text: 'Đóng gói', level: 3, index: 2 },
    { id: 'bai-viet-dong-goi-2-2', text: 'Đóng gói 2', level: 2, index: 3 },
    { id: 'bai-viet-dong-goi-3', text: 'Đóng gói', level: 2, index: 4 },
  ]);
  assert.deepEqual(extractArticleHeadings(null), []);
});

test('reading time counts nested visible text and rounds up at 200 words per minute', () => {
  const paragraph = (count: number) => ({
    type: 'paragraph', children: [text('từ '.repeat(count - 1)), text('Việ'), { type: 'link', children: [text('t')] }],
  });
  assert.equal(articleReadingMinutes(null), 1);
  assert.equal(articleReadingMinutes(document(paragraph(200))), 1);
  assert.equal(articleReadingMinutes(document(paragraph(200), { type: 'list', children: [{ type: 'listitem', children: [text('thêm')] }] })), 2);
  assert.equal(articleReadingMinutes(document(paragraph(400))), 2);
});
