import type { ProductCategory } from '@/payload-types';

interface ShelfSettings {
  homeCategoryShelvesEnabled?: boolean | null;
  homeCategoryShelves?: {
    enabled?: boolean | null;
    category?: number | { id: number } | null;
    title?: string | null;
  }[] | null;
}

export function resolveHomeCategoryShelves(settings: ShelfSettings | null | undefined, categories: ProductCategory[]) {
  if (settings?.homeCategoryShelvesEnabled === false) return [];
  const published = new Map(categories.filter(category => category.status === 'published').map(category => [category.id, category]));
  const rows = settings?.homeCategoryShelves?.length
    ? settings.homeCategoryShelves
    : categories.filter(category => !category.parent && category.status === 'published').slice(0, 3).map(category => ({ category: category.id, enabled: true, title: '' }));
  const seen = new Set<number>();
  return rows.flatMap(row => {
    const id = typeof row.category === 'object' ? row.category?.id : row.category;
    const category = id ? published.get(id) : undefined;
    if (row.enabled === false || !category || seen.has(category.id)) return [];
    seen.add(category.id);
    return [{ category, title: row.title?.trim() || category.name }];
  }).slice(0, 6);
}

export function shelfPages<T>(products: T[]): T[][] {
  if (!products.length) return [];
  if (products.length < 4) return [products];
  // Four products can still move together by rotating their order.
  if (products.length === 4) return products.map((_, index) => [...products.slice(index), ...products.slice(0, index)]);
  const pages: T[][] = [];
  for (let index = 0; index < products.length; index += 4) pages.push(products.slice(index, index + 4));
  // Fill the last page using the first items, without duplicates within that page.
  const last = pages.at(-1);
  if (last && last.length < 4) last.push(...products.slice(0, 4 - last.length));
  return pages;
}
