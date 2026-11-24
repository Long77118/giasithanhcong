export const richTextImageLayoutConfig = {
  // Presets are percentages of the available content column, before the original-width cap.
  presets: { small: 30, medium: 60, large: 80, full: 100 },
  defaultSize: 'medium',
  defaultAlignment: 'center',
  customLimits: {
    percent: { min: 10, max: 100 },
    px: { min: 80, max: 1600 },
  },
  phone: { breakpoint: '40rem', minimumPercent: 92 },
} as const;

export const richTextImageAlignments = ['left', 'center', 'right'] as const;

export function isRichTextImageWidthUnit(value: unknown): value is keyof typeof richTextImageLayoutConfig.customLimits {
  return value === 'percent' || value === 'px';
}
