import type { CollectionConfig } from 'payload';
import { toVietnameseSlug } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAuthenticated, publishedOrAuthenticated } from './access';

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Bài viết Blog',
    plural: 'Bài viết Blog',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'authorName', 'publishedAt', 'status'],
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
        if (data && !data.slug && typeof data.title === 'string') {
          data.slug = toVietnameseSlug(data.title);
        }
        return data;
      },
    ],
    afterChange: [
      ({ doc }) => {
        safeRevalidateTags(
          ['blog', 'posts', 'sitemap'],
          ['/', '/blog', `/blog/${doc.slug}`, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['blog', 'posts', 'sitemap'],
          ['/', '/blog', `/blog/${doc.slug}`, '/sitemap.xml'],
        );
      },
    ],
  },
  fields: [
    {
      name: 'title',
      label: 'Tiêu đề bài viết',
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
      name: 'excerpt',
      label: 'Tóm tắt bài viết',
      type: 'textarea',
      required: true,
    },
    {
      name: 'coverImage',
      label: 'Ảnh đại diện',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      label: 'Nội dung bài viết',
      type: 'richText',
      required: true,
    },
    {
      name: 'category',
      label: 'Chuyên mục',
      type: 'relationship',
      relationTo: 'post-categories',
      required: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'authorName',
          label: 'Tên tác giả hiển thị',
          type: 'text',
          required: true,
          defaultValue: 'Ban Biên Tập Bao Bì An Phát',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'author',
          label: 'Tài khoản tác giả (Nội bộ)',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'publishedAt',
      label: 'Ngày xuất bản',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'relatedProducts',
      label: 'Sản phẩm liên quan',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
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
