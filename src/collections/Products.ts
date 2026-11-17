import type { CollectionConfig } from 'payload';
import { toVietnameseSlug } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAuthenticated, publishedOrAuthenticated } from './access';

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Sản phẩm bán sỉ',
    plural: 'Sản phẩm bán sỉ',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['sku', 'name', 'category', 'minOrderQty', 'status', 'updatedAt'],
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
          ['catalog', 'products', 'sitemap'],
          ['/', '/san-pham', `/san-pham/${doc.slug}`, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['catalog', 'products', 'sitemap'],
          ['/', '/san-pham', `/san-pham/${doc.slug}`, '/sitemap.xml'],
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
      type: 'row',
      fields: [
        {
          name: 'slug',
          label: 'Đường dẫn (Slug)',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: {
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
      type: 'row',
      fields: [
        {
          name: 'price',
          label: 'Giá sỉ tham khảo (VNĐ)',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Để trống hoặc tắt "Hiển thị giá" để hiển thị "Liên hệ báo giá".',
          },
        },
        {
          name: 'showPrice',
          label: 'Công bố giá tham khảo',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '50%',
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
