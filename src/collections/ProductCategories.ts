import type { CollectionConfig } from 'payload';
import { generateInitialSlug, guardPublicSlug, publicSlugField } from '../lib/public-slug-hooks';
import { publicContentPath } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin, publishedOrAdmin } from './access';
import { guardProductCategoryDelete, validateCategoryParent } from '../lib/category-guards';

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: {
    singular: 'Danh mục sản phẩm',
    plural: 'Danh mục sản phẩm',
  },
  admin: {
    group: 'Danh mục hàng',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent', 'status', 'displayOrder'],
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [validateCategoryParent, guardPublicSlug],
    beforeDelete: [guardProductCategoryDelete],
    beforeValidate: [generateInitialSlug('name')],
    afterChange: [
      ({ doc, previousDoc }) => {
        const currentPath = publicContentPath('product-categories', doc.slug);
        const changedPaths = previousDoc && previousDoc.slug !== doc.slug
          ? [publicContentPath('product-categories', previousDoc.slug), currentPath]
          : [currentPath];
        safeRevalidateTags(
          ['catalog', 'categories', 'sitemap'],
          ['/', '/san-pham', ...changedPaths, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['catalog', 'categories', 'sitemap'],
          ['/', '/san-pham', publicContentPath('product-categories', doc.slug), '/sitemap.xml'],
        );
      },
    ],
  },
  fields: [
    {
      name: 'name',
      label: 'Tên danh mục',
      type: 'text',
      required: true,
    },
    publicSlugField,
    {
      name: 'description',
      label: 'Mô tả danh mục',
      type: 'textarea',
    },
    {
      name: 'image',
      label: 'Ảnh đại diện danh mục',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'parent',
      label: 'Danh mục cha',
      type: 'relationship',
      relationTo: 'product-categories',
      admin: {
        description: 'Để trống nếu đây là danh mục gốc. Không chọn chính danh mục này hoặc danh mục cấp dưới.',
      },
    },
    {
      name: 'displayOrder',
      label: 'Thứ tự hiển thị',
      type: 'number',
      defaultValue: 1,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      label: 'Trạng thái xuất bản',
      type: 'select',
      required: true,
      defaultValue: 'draft',
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
