import { asRecord } from './rich-text';
import { isRichTextImageWidthUnit, richTextImageAlignments, richTextImageLayoutConfig } from './rich-text-image-layout-config';

type ImageAlignment = (typeof richTextImageAlignments)[number];
type ImageWidth = { value: number; unit: 'percent' | 'px' };

export type RichTextImageSizeContext = {
  // These CSS lengths describe the content column, and are supplied by the page code.
  phoneWidth: string;
  width: string;
  mediaWidths?: readonly { media: string; width: string }[];
};

const { presets, defaultSize, defaultAlignment, customLimits, phone } = richTextImageLayoutConfig;

function imageWidth(fields: Record<string, unknown> | undefined): ImageWidth {
  const size = fields?.imageSize;
  if (size === 'custom') {
    const customWidth = fields?.customWidth;
    const customWidthUnit = fields?.customWidthUnit;
    if (isRichTextImageWidthUnit(customWidthUnit) && typeof customWidth === 'number' && Number.isFinite(customWidth)) {
      const { min, max } = customLimits[customWidthUnit];
      return { value: Math.max(min, Math.min(max, customWidth)), unit: customWidthUnit };
    }
  }
  const preset = typeof size === 'string' && Object.hasOwn(presets, size) ? size as keyof typeof presets : defaultSize;
  return { value: presets[preset], unit: 'percent' };
}

export function richTextImageLayout(value?: unknown, originalWidth?: number) {
  const fields = asRecord(value);
  const alignment: ImageAlignment = richTextImageAlignments.find(option => option === fields?.imageAlignment) ?? defaultAlignment;
  const width = imageWidth(fields);
  const intrinsicWidth = typeof originalWidth === 'number' && Number.isFinite(originalWidth) && originalWidth > 0
    ? originalWidth : undefined;
  const cssWidth = `${width.value}${width.unit === 'percent' ? '%' : 'px'}`;

  return {
    alignment,
    wrapText: alignment !== 'center' && fields?.wrapText === true,
    width,
    intrinsicWidth,
    style: {
      '--rich-text-image-width': cssWidth,
      '--rich-text-image-phone-width': `max(${phone.minimumPercent}%, ${cssWidth})`,
      '--rich-text-image-max-width': intrinsicWidth ? `min(100%, ${intrinsicWidth}px)` : '100%',
    },
  };
}

export function richTextImageSizes(layout: ReturnType<typeof richTextImageLayout>, context: RichTextImageSizeContext) {
  const { width, intrinsicWidth } = layout;
  const scale = (available: string, percent: number) => percent === 100 ? available : `calc(${available} * ${percent / 100})`;
  function sourceWidth(available: string, onPhone = false) {
    const requested = width.unit === 'percent' ? scale(available, width.value) : `${width.value}px`;
    const mobileWidth = onPhone ? `max(${scale(available, phone.minimumPercent)}, ${requested})` : requested;
    return `min(${available}, ${mobileWidth}${intrinsicWidth ? `, ${intrinsicWidth}px` : ''})`;
  }

  // Lazy images use their laid-out width where auto is supported. Other browsers use the viewport estimates.
  return [
    'auto',
    `(width < ${phone.breakpoint}) ${sourceWidth(context.phoneWidth, true)}`,
    ...(context.mediaWidths ?? []).map(({ media, width: available }) => `${media} ${sourceWidth(available)}`),
    sourceWidth(context.width),
  ].join(', ');
}
