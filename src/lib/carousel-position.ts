export interface CarouselPosition {
  index: number;
  progress: number;
}

/** Keep the visible item and its fractional position as CSS slide widths change. */
export function readCarouselPosition(offsets: readonly number[], scrollLeft: number): CarouselPosition {
  if (!offsets.length || !Number.isFinite(scrollLeft)) return { index: 0, progress: 0 };
  const index = Math.max(0, offsets.findLastIndex(offset => offset <= scrollLeft));
  const width = (offsets[index + 1] ?? offsets[index]) - offsets[index];
  return { index, progress: width > 0 ? Math.max(0, Math.min(1, (scrollLeft - offsets[index]) / width)) : 0 };
}

export function carouselOffset(offsets: readonly number[], position: CarouselPosition): number {
  if (!offsets.length) return 0;
  const index = Math.max(0, Math.min(offsets.length - 1, position.index));
  const width = (offsets[index + 1] ?? offsets[index]) - offsets[index];
  return offsets[index] + width * Math.max(0, Math.min(1, position.progress));
}
