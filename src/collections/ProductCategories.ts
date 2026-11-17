import type { CollectionConfig } from 'payload';
import { toVietnameseSlug } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAuthenticated, publishedOrAuthenticated } from './access';

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: {
    singular: 'Danh mục sản phẩm',
    plural: 'Danh mục sản phẩm',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'parent', 'status', 'displayOrder'],
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && typeof data.name === 'string') {
          data.slug = toVietnameseSlug(data.name);
        }
        return data;
      },
    ],
    afterChange: [
      ({ doc }) => {
        safeRevalidateTags(
          ['catalog', 'categories', 'sitemap'],
          ['/', '/san-pham', `/danh-muc/${doc.slug}`, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['catalog', 'categories', 'sitemap'],
          ['/', '/san-pham', `/danh-muc/${doc.slug}`, '/sitemap.xml'],
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
