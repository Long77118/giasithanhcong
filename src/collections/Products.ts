import type { CollectionConfig } from 'payload';
import { generateInitialSlug, guardPublicSlug, publicSlugField } from '../lib/public-slug-hooks';
import { publicContentPath } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin, publishedOrAdmin } from './access';

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Sản phẩm bán sỉ',
    plural: 'Sản phẩm bán sỉ',
  },
  admin: {
    group: 'Danh mục hàng',
    useAsTitle: 'name',
    defaultColumns: ['sku', 'name', 'category', 'minOrderQty', 'status', 'updatedAt'],
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [guardPublicSlug],
    beforeValidate: [generateInitialSlug('name')],
    afterChange: [
      ({ doc, previousDoc }) => {
        const currentPath = publicContentPath('products', doc.slug);
        const changedPaths = previousDoc && previousDoc.slug !== doc.slug
          ? [publicContentPath('products', previousDoc.slug), currentPath]
          : [currentPath];
        safeRevalidateTags(
          ['catalog', 'products', 'sitemap'],
          ['/', '/san-pham', ...changedPaths, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['catalog', 'products', 'sitemap'],
          ['/', '/san-pham', publicContentPath('products', doc.slug), '/sitemap.xml'],
        );
      },
    ],
  },
  fields: [
    {
      name: 'name',
      label: 'Tên sản phẩm',
      type: 'text',
      required: true,
    },
    {
      name: 'brandName',
      label: 'Thương hiệu sản phẩm',
      type: 'text',
      admin: {
        description: 'Điền thương hiệu của sản phẩm. Để trống nếu chưa xác định được.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          ...publicSlugField,
          admin: {
            ...publicSlugField.admin,
            width: '50%',
          },
        },
        {
          name: 'sku',
          label: 'Mã sản phẩm (SKU)',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'category',
      label: 'Danh mục sản phẩm',
      type: 'relationship',
      relationTo: 'product-categories',
      required: true,
      index: true,
    },
    {
      name: 'shortDescription',
      label: 'Mô tả ngắn',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      label: 'Nội dung chi tiết',
      type: 'richText',
    },
    {
      name: 'images',
      label: 'Bộ ảnh sản phẩm',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'image',
          label: 'Hình ảnh',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          label: 'Ghi chú góc chụp / quy cách',
          type: 'text',
        },
      ],
    },
    {
      name: 'specs',
      label: 'Thông số kỹ thuật',
      type: 'array',
      fields: [
        {
          name: 'label',
          label: 'Tên thông số',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          label: 'Giá trị',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'packagingSpec',
          label: 'Quy cách đóng gói',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            placeholder: 'Ví dụ: 1.000 cái / thùng (20 lốc x 50 cái)',
          },
        },
        {
          name: 'minOrderQty',
          label: 'Số lượng đặt tối thiểu (MOQ)',
          type: 'number',
          min: 1,
          admin: {
            width: '25%',
          },
        },
        {
          name: 'minOrderUnit',
          label: 'Đơn vị MOQ',
          type: 'text',
          defaultValue: 'thùng',
          admin: {
            width: '25%',
          },
        },
      ],
    },
    {
      name: 'relatedProducts',
      label: 'Sản phẩm liên quan',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'featured',
      label: 'Sản phẩm nổi bật trang chủ',
      type: 'checkbox',
      defaultValue: false,
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
