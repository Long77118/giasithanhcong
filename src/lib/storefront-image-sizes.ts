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
