// 11 cards occupy 12 slots: two for the lead and one for each of the ten other cards.
// 12 is divisible by each of the tablet and desktop column counts (2, 3 and 4).
export const blogPostsPerPage = 11;

const shellWidth = '(min(100vw, 90rem) - 3rem)';
const breakpoints = [{ min: 40, columns: 2 }, { min: 64, columns: 3 }, { min: 80, columns: 4 }] as const;

export function blogListingSpan(count: number, index: number, columns: number): number {
  if (index === 0) return count === 1 ? columns : 2;
  if (index === count - 1) return 1 + (columns - ((count + 1) % columns)) % columns;
  return 1;
}

export function blogListingCover(count: number, index: number) {
  const slots = breakpoints.map(({ min, columns }) => {
    const span = blogListingSpan(count, index, columns);
    const cardWidth = `((${shellWidth} - ${columns - 1}rem) / ${columns} * ${span} + ${span - 1}rem - 2px)`;
    const inlinePhoto = index > 0 && span > 1 && !(count === 2 && columns === 4);
    const photoWidth = count === 1
      ? `${cardWidth} * .55`
      : inlinePhoto ? `${cardWidth} * .42` : cardWidth;
    return { span, size: `(min-width: ${min}rem) calc(${photoWidth})` };
  });
  return {
    spans: slots.map(({ span }) => span),
    sizes: [
      ...slots.toReversed().map(({ size }) => size),
      index === 0 ? 'calc(100vw - 2rem - 2px)' : 'clamp(4.75rem, 26vw, 7rem)',
    ].join(', '),
  };
}

const postDateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatBlogListingDate(iso?: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : postDateFormat.format(date);
}
