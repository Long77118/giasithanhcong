// These source sizes follow the grid breakpoints, gaps and page gutters.
const oneColumn = 'calc(100vw - 32px)';
const twoColumns = '(min-width: 40rem) calc(50vw - 36px)';
const threeColumns = '(min-width: 64rem) calc(33.333vw - 32px)';
const fourColumns = '(min-width: 80rem) calc(25vw - 30px)';

export const threeColumnCardSizes = [threeColumns, twoColumns, oneColumn].join(', ');
export const fourColumnCardSizes = [fourColumns, threeColumns, twoColumns, oneColumn].join(', ');

export const catalogCardSizes = [
  '(min-width: 144rem) calc(16.667vw - 31px)',
  '(min-width: 108rem) calc(20vw - 32px)',
  fourColumnCardSizes,
].join(', ');

export const compactCatalogCardSizes = `(max-width: 39.999rem) 96px, ${catalogCardSizes}`;

export const featuredCardSizes = [
  '(min-width: 100rem) calc(25vw - 30px)',
  '(min-width: 64rem) calc(25vw - 26px)',
  '(min-width: 40rem) calc(50vw - 34px)',
  'calc(50vw - 22px)',
].join(', ');

export const productGallerySizes = [
  '(min-width: 100rem) calc(53.5vw - 96px)',
  '(min-width: 64rem) calc(53.5vw - 87px)',
  '(min-width: 40rem) calc(100vw - 116px)',
  'calc(100vw - 66px)',
].join(', ');
