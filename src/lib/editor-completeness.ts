import { articleWordCount } from './article-content';
import { asRecord } from './rich-text';

export const PRODUCT_DESCRIPTION_MIN = 150;
export const PRODUCT_DESCRIPTION_MAX = 200;

// Match the current @payloadcms/plugin-seo indicator defaults.
const seoTitle = { min: 50, max: 60 };
const seoDescription = { min: 100, max: 150 };

type CheckState = 'done' | 'missing' | 'checking' | 'unverified';
type Item = { id: string; label: string; hint: string; state: CheckState; completedHint?: string };
export type SelectedImage = { id: string; alt?: string };
type Meta = { title: unknown; description: unknown };
type ImageLookup = { state: 'checking' | 'ready' | 'error'; alts: ReadonlyMap<string, string> };

const text = (value: unknown) => typeof value === 'string' ? value : '';

function referenceId(value: unknown): string | undefined {
  const id = asRecord(value)?.id ?? value;
  const normalized = typeof id === 'number' || typeof id === 'string' ? String(id) : '';
  return /^[1-9]\d*$/.test(normalized) ? normalized : undefined;
}

export function selectedImage(value: unknown): SelectedImage | undefined {
  const saved = asRecord(value);
  const image = saved?.relationTo === 'media' ? saved.value : value;
  const id = referenceId(image);
  const alt = asRecord(image)?.alt;
  return id ? { id, alt: typeof alt === 'string' ? alt : undefined } : undefined;
}

function item(id: string, label: string, hint: string, done: boolean): Item {
  return { id, label, hint, state: done ? 'done' : 'missing' };
}

function checkAlt(images: SelectedImage[], lookup: ImageLookup): Item {
  const result = item('alt', 'Văn bản thay thế', 'Thư viện ảnh · Kiểm tra Alt SEO của ảnh đã chọn.', false);
  if (!images.length) return { ...result, hint: 'Chọn ảnh để kiểm tra Alt SEO.' };
  if (images.some(image => image.alt === undefined)) {
    if (lookup.state === 'checking') return { ...result, state: 'checking', hint: 'Đang kiểm tra ảnh trong thư viện…' };
    if (lookup.state === 'error') return { ...result, state: 'unverified', hint: 'Chưa kiểm tra được ảnh. Kiểm tra kết nối hoặc mở Thư viện ảnh.' };
  }
  const done = images.every(image => (image.alt ?? lookup.alts.get(image.id) ?? '').trim());
  return { ...result, state: done ? 'done' : 'missing' };
}

function seoItems(meta: Meta) {
  return [
    { id: 'seo-title', label: 'Tiêu đề SEO', value: meta.title, range: seoTitle },
    { id: 'seo-description', label: 'Mô tả SEO', value: meta.description, range: seoDescription },
  ].map(({ id, label, value, range }) => {
    const length = text(value).trim().length;
    return item(id, label, `Tab SEO · ${length}/${range.min}–${range.max} ký tự`, length >= range.min && length <= range.max);
  });
}

export function productChecklist(input: {
  name: unknown;
  sku: unknown;
  category: unknown;
  shortDescription: unknown;
  imageRows: unknown[];
  specs: unknown[];
  packagingSpec: unknown;
  meta: Meta;
}, lookup: ImageLookup) {
  const images = input.imageRows.flatMap(row => selectedImage(row) ?? []);
  const description = text(input.shortDescription);
  return [
    item('identity', 'Tên và mã sản phẩm', 'Tab Cơ bản', Boolean(text(input.name).trim() && text(input.sku).trim())),
    item('category', 'Danh mục sản phẩm', 'Tab Cơ bản', Boolean(referenceId(input.category))),
    item('description', 'Mô tả ngắn', `Tab Cơ bản · ${description.length}/${PRODUCT_DESCRIPTION_MIN}–${PRODUCT_DESCRIPTION_MAX} ký tự`,
      description.trim().length >= PRODUCT_DESCRIPTION_MIN && description.length <= PRODUCT_DESCRIPTION_MAX),
    item('image', 'Ảnh chính', 'Tab Hình ảnh · Chọn ảnh cho dòng đầu tiên.', Boolean(selectedImage(input.imageRows[0]))),
    checkAlt(images, lookup),
    item('specs', 'Thông số kỹ thuật', 'Tab Thông số và đóng gói · Thêm ít nhất một cặp tên và giá trị.', input.specs.some(spec => {
      const record = asRecord(spec);
      return Boolean(text(record?.label).trim() && text(record?.value).trim());
    })),
    item('packaging', 'Quy cách đóng gói', 'Tab Thông số và đóng gói', Boolean(text(input.packagingSpec).trim())),
    ...seoItems(input.meta),
  ];
}

export function postChecklist(input: {
  title: unknown;
  excerpt: unknown;
  category: unknown;
  coverImage: unknown;
  content: unknown;
  meta: Meta;
}, lookup: ImageLookup) {
  const cover = selectedImage(input.coverImage);
  const words = articleWordCount(input.content);
  return [
    item('title', 'Tiêu đề bài viết', 'Tab Bài viết Blog', Boolean(text(input.title).trim())),
    item('excerpt', 'Tóm tắt bài viết', 'Tab Bài viết Blog', Boolean(text(input.excerpt).trim())),
    item('category', 'Chuyên mục', 'Tab Bài viết Blog', Boolean(referenceId(input.category))),
    item('image', 'Ảnh đại diện', 'Tab Bài viết Blog', Boolean(cover)),
    checkAlt(cover ? [cover] : [], lookup),
    {
      ...item('content', 'Nội dung bài viết', 'Tab Bài viết Blog · Nội dung cần có văn bản.', words > 0),
      completedHint: `${words.toLocaleString('vi-VN')} từ`,
    },
    ...seoItems(input.meta),
  ];
}
