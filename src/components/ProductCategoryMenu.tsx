import { BottleWine, CupSoda, Layers2, Package, ShoppingBag } from 'lucide-react';
import { categoryTreeOptions } from '@/lib/category-tree';
import { publicContentPath } from '@/lib/slug';
import type { ProductCategory } from '@/payload-types';

export function categoryMenuItems(categories: ProductCategory[]) {
  return categoryTreeOptions(categories).map(({ category, depth }) => ({
    id: category.id,
    name: category.name,
    href: publicContentPath('product-categories', category.slug),
    depth,
  }));
}

export type CategoryMenuItem = ReturnType<typeof categoryMenuItems>[number];

const categoryIcons = new Map([
  ['/danh-muc/ly-coc-dung-mot-lan', CupSoda],
  ['/danh-muc/hop-khay-thuc-pham', Layers2],
  ['/danh-muc/chai-hu-nhua-pet', BottleWine],
  ['/danh-muc/tui-bao-bi-giay', ShoppingBag],
]);

export function CategoryIcon({ href }: { href: string }) {
  const Icon = categoryIcons.get(href) ?? Package;
  return <Icon size={22} strokeWidth={1.65} aria-hidden="true" />;
}
