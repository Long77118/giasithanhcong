import type { CollectionConfig } from 'payload';
import { toVietnameseSlug } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin, publishedOrAdmin } from './access';
import { guardPostCategoryDelete } from '../lib/category-guards';

export const PostCategories: CollectionConfig = {
  slug: 'post-categories',
  labels: {
    singular: 'Chuyên mục bài viết',
    plural: 'Chuyên mục bài viết',
  },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status'],
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [guardPostCategoryDelete],
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && typeof data.name === 'string') {
          data.slug = toVietnameseSlug(data.name);
        }
        return data;
      },
    ],
    afterChange: [
      () => safeRevalidateTags(['blog', 'sitemap'], ['/blog', '/sitemap.xml']),
    ],
    afterDelete: [
      () => safeRevalidateTags(['blog', 'sitemap'], ['/blog', '/sitemap.xml']),
    ],
  },
  fields: [
    {
      name: 'name',
      label: 'Tên chuyên mục',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Đường dẫn (Slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      label: 'Mô tả chuyên mục',
      type: 'textarea',
    },
    {
      name: 'status',
      label: 'Trạng thái xuất bản',
      type: 'select',
      required: true,
      defaultValue: 'published',
      index: true,
      options: [
        { label: 'Bản nháp (Draft)', value: 'draft' },
        { label: 'Đã xuất bản (Published)', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
