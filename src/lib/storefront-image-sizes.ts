import type { RichTextImageSizeContext } from './rich-text-image-layout';

// These source sizes follow the grid breakpoints, gaps and page gutters.
const oneColumn = 'calc(100vw - 32px)';
const twoColumns = '(min-width: 40rem) calc(50vw - 36px)';
const threeColumns = '(min-width: 64rem) calc(33.333vw - 32px)';
const fourColumns = '(min-width: 80rem) calc(25vw - 30px)';

// Match the 90rem centered shell, including its 3rem gutter and grid gaps.
export const threeColumnCardSizes = ['(min-width: 90rem) 448px', threeColumns, twoColumns, oneColumn].join(', ');
export const fourColumnCardSizes = ['(min-width: 90rem) 330px', fourColumns, threeColumns, twoColumns, oneColumn].join(', ');

export const catalogCardSizes = fourColumnCardSizes;

export const compactCatalogCardSizes = `(max-width: 39.999rem) 96px, ${catalogCardSizes}`;

export const featuredCardSizes = [
  '(min-width: 90rem) 334px',
  '(min-width: 64rem) calc(25vw - 26px)',
  '(min-width: 40rem) calc(50vw - 34px)',
  'calc(50vw - 22px)',
].join(', ');

export const productGallerySizes = [
  '(min-width: 77.5rem) 590px',
  '(min-width: 48rem) calc(51vw - 44px)',
  '(min-width: 40rem) calc(100vw - 48px)',
  'calc(100vw - 32px)',
].join(', ');

// Match the news grid: 90rem shell, 1rem gaps, and a 1px border on each card.
export function homeNewsCoverSizes(count: number, index: number): string {
  const shell = 'min(100vw, 90rem) - 3rem';
  const columns = `${shell} - 1rem`;
  const half = `(${columns}) / 2 - 2px`;
  const lead = index === 0;
  const desktop = count === 1 ? `(${shell} - 2px) * .52`
    : count === 2 ? half
    : lead ? `(${columns}) * .52 - 2px`
    : count >= 5 ? `((${columns}) * .48 - 1rem) / 2 - 2px`
    : `((${columns}) * .48 - 1.5rem - 2px) * ${count === 3 ? '.52' : '.38'}`;
  const tablet = count === 2 ? half
    : lead ? `${shell} - 2px`
    : count === 4 && index === 3 ? `(${shell} - 1.5rem - 2px) * .28`
    : half;
  return [
    `(min-width: 64rem) calc(${desktop})`,
    `(min-width: 40rem) calc(${tablet})`,
    lead ? 'calc(100vw - 2rem - 2px)' : 'clamp(5rem, 26vw, 8rem)',
  ].join(', ');
}

// Product shell (1240px max), page gutters and the description section's padding and border.
export const productDescriptionImageContext: RichTextImageSizeContext = {
  phoneWidth: 'calc(100vw - 4.5rem - 2px)',
  width: 'calc(min(100vw, 1240px) - 5.5rem - 2px)',
};

// Match the article measure and account for the rail only when the desktop grid has one.
export function articleBodyImageContext(hasSidebar: boolean): RichTextImageSizeContext {
  return {
    phoneWidth: 'calc(100vw - 2rem)',
    width: 'min(46.25rem, calc(100vw - 3rem))',
    mediaWidths: hasSidebar ? [{
      media: '(min-width: 64rem)',
      width: 'min(46.25rem, calc(min(72rem, 100vw - 3rem) - 20.625rem - clamp(1.5rem, 4vw, 3.5rem)))',
    }] : undefined,
  };
}
