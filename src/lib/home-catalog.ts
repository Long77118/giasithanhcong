import type { ProductCategory } from '@/payload-types';
import { resolveMediaUrl } from '@/components/MediaImage';

const categoryArtwork = [
  { filename: 'cat_cups_disposable_', image: 'cups-cutout', label: 'Ly & cốc' },
  { filename: 'cat_food_containers_', image: 'containers-cutout', label: 'Hộp & khay' },
  { filename: 'cat_bottles_jars_', image: 'bottles-cutout', label: 'Chai & hũ PET' },
  { filename: 'cat_bags_paper_', image: 'paper-cutout', label: 'Túi & bao bì giấy' },
];

export function getHomeCategoryArtwork(category: ProductCategory) {
  const filename = typeof category.image === 'object' ? category.image?.filename : '';
  const artwork = categoryArtwork.find((item) => filename?.startsWith(item.filename));
  if (artwork) {
    return { url: `/images/home/${artwork.image}.webp`, width: 640, height: 640, label: artwork.label };
  }
  const image = resolveMediaUrl(category.image);
  return { ...image, label: category.name };
}

export const homeProductShortcuts = [
  { label: 'Ly giấy', query: 'Ly Giấy', image: 'paper-cup' },
  { label: 'Hộp cơm', query: 'Hộp Cơm', image: 'bento-box' },
  { label: 'Tô giấy', query: 'Tô Giấy', image: 'paper-bowl' },
  { label: 'Hũ nhựa', query: 'Hũ Nhựa', image: 'pet-jar' },
  { label: 'Túi giấy', query: 'Túi Giấy', image: 'paper-bag' },
  { label: 'Giấy gói', query: 'Giấy Gói', image: 'wrapping-paper' },
];
