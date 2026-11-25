const gridWidth = '(min(100vw, 90rem) - 3rem)';
const firstRowBreakpoints = ['(min-width: 40rem)', '(min-width: 64rem)', '(min-width: 80rem)'];

// Match the listing shell, 1rem gaps, card borders, and the 8% inset on each side of a photo.
export const productListingImageSizes = [
  `(min-width: 80rem) calc(((${gridWidth} - 3rem) / 4 - 2px) * .84)`,
  `(min-width: 64rem) calc(((${gridWidth} - 2rem) / 3 - 2px) * .84)`,
  `(min-width: 40rem) calc(((${gridWidth} - 1rem) / 2 - 2px) * .84)`,
  'calc(clamp(4.5rem, 25vw, 6.5rem) * .84)',
].join(', ');

export function productListingImageSchedule(index: number) {
  return {
    loading: index === 0 ? 'eager' : 'lazy',
    fetchPriority: index === 0 ? 'high' : undefined,
    preloadMedia: firstRowBreakpoints[index - 1],
  } as const;
}
