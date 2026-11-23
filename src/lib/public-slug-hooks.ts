import { randomBytes } from 'node:crypto';
import { sql } from '@payloadcms/db-postgres';
import {
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type TextField,
} from 'payload';
import { getWriteTransaction } from './db-transaction';
import { isPublicContentCollection, isValidPublicSlug, publicSlugMaxLength, toVietnameseSlug } from './slug';

const slugWriteLocks = {
  'product-categories': 2,
  products: 3,
  posts: 4,
} as const;
const publicSlugLabel = 'Đường dẫn (slug)';

export function generateInitialSlug(titleField: 'name' | 'title'): CollectionBeforeValidateHook {
  return ({ data, operation }) => {
    if (operation === 'create' && data && (data.slug == null || data.slug === '')) {
      const title = data[titleField];
      if (typeof title === 'string') {
        data.slug = toVietnameseSlug(title).slice(0, publicSlugMaxLength).replace(/-$/, '');
      }
    }
    return data;
  };
}

export const guardPublicSlug: CollectionBeforeChangeHook = async ({ collection, data, originalDoc, operation, req }) => {
  const namespace = collection.slug;
  if (!isPublicContentCollection(namespace)) throw new Error(`Unexpected slug collection: ${namespace}`);

  const slug = data.slug;
  if (operation === 'update' && (slug === undefined || slug === originalDoc?.slug)) return data;

  const invalid = (message: string): never => {
    throw new ValidationError({ collection: namespace, errors: [{ path: 'slug', label: publicSlugLabel, message }], req }, req.t);
  };
  if (!isValidPublicSlug(slug)) {
    invalid(`Hãy dùng tối đa ${publicSlugMaxLength} ký tự gồm chữ thường a–z, số và dấu gạch ngang đơn giữa các từ.`);
  }

  const db = await getWriteTransaction(req);
  // Serialize CMS claims so a conflicting save can report an error on the slug field.
  // The unique reservation in PostgreSQL also covers concurrent writes outside the CMS.
  await db.execute(sql`SELECT pg_advisory_xact_lock(208174, ${slugWriteLocks[namespace]})`);
  const { rows } = await db.execute(sql`
    SELECT 1 FROM public.content_slug_history WHERE namespace = ${namespace} AND slug = ${slug}
  `);
  if (rows.length) invalid('Đường dẫn này đang được dùng hoặc dành cho chuyển hướng. Hãy chọn đường dẫn khác.');

  return data;
};

export const publicSlugField: TextField = {
  name: 'slug',
  label: publicSlugLabel,
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { description: 'Ví dụ ly-nhua-pet-500ml. Nếu bạn đổi đường dẫn, khách mở link cũ sẽ được chuyển sang link mới.' },
  hooks: {
    beforeDuplicate: [
      ({ value }) => {
        const base = toVietnameseSlug(String(value ?? '')).slice(0, publicSlugMaxLength - 22).replace(/-$/, '');
        return `${base || 'noi-dung'}-ban-sao-${randomBytes(6).toString('hex')}`;
      },
    ],
  },
};
