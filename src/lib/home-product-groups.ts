import type { Where } from 'payload';
import type { ProductCategory } from '@/payload-types';
import { categorySubtreeIDs } from './category-tree';

// Curated shopping needs, using existing categories and product copy; no CMS field required.
const homeProductGroups = [
  { id: 'all', label: 'Tất cả', categorySlugs: [], keywords: [] },
  {
    id: 'drinks', label: 'Cà phê & trà sữa',
    categorySlugs: ['ly-coc-dung-mot-lan'],
    keywords: ['cà phê', 'trà sữa', 'đồ uống', 'nước ép', 'sữa hạt', 'detox'],
  },
  {
    id: 'takeaway', label: 'Đồ ăn mang đi',
    categorySlugs: ['hop-khay-thuc-pham'],
    keywords: ['hộp cơm', 'đồ chiên', 'burger', 'bánh mì'],
  },
  {
    id: 'bakery', label: 'Bánh & tráng miệng',
    categorySlugs: [],
    keywords: ['bánh', 'tráng miệng', 'mứt', 'granola', 'sữa chua', 'pudding'],
  },
];

export function getHomeProductGroupFilters(categories: ProductCategory[]) {
  return homeProductGroups.map(({ id, label, categorySlugs, keywords }) => {
    const categoryIDs = [...new Set(categories
      .filter(category => categorySlugs.includes(category.slug) && category.status === 'published')
      .flatMap(category => categorySubtreeIDs(category.id, categories)))];
    const matches = keywords.flatMap((keyword): Where[] => [
      { name: { like: keyword } },
      { shortDescription: { like: keyword } },
    ]);
    if (categoryIDs.length) matches.unshift({ category: { in: categoryIDs } });
    const where: Where = id === 'all'
      ? { status: { equals: 'published' } }
      : { and: [{ status: { equals: 'published' } }, { or: matches }] };
    return { id, label, where };
  });
}
