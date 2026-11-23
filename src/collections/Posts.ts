import type { CollectionConfig } from 'payload';
import { generateInitialSlug, guardPublicSlug, publicSlugField } from '../lib/public-slug-hooks';
import { publicContentPath } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin, publishedOrAdmin } from './access';
import { previewUrl } from '../lib/preview';

const postLabel = 'Bài viết Blog';

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: postLabel,
    plural: postLabel,
  },
  admin: {
    group: 'Danh mục và nội dung',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'authorName', 'publishedAt', 'status'],
    preview: (doc) => previewUrl('posts', doc.id),
    description: 'Bấm Lưu trước khi Xem trước. Chỉ quản trị viên xem được bản nháp đã lưu.',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [guardPublicSlug],
    beforeValidate: [generateInitialSlug('title')],
    afterChange: [
      ({ doc, previousDoc }) => {
        const currentPath = publicContentPath('posts', doc.slug);
        const changedPaths = previousDoc && previousDoc.slug !== doc.slug
          ? [publicContentPath('posts', previousDoc.slug), currentPath]
          : [currentPath];
        safeRevalidateTags(
          ['blog', 'posts', 'sitemap'],
          ['/', '/blog', ...changedPaths, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['blog', 'posts', 'sitemap'],
          ['/', '/blog', publicContentPath('posts', doc.slug), '/sitemap.xml'],
        );
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [{
        label: postLabel,
        fields: [
          {
            name: 'title',
            label: 'Tiêu đề bài viết',
            type: 'text',
            required: true,
          },
          publicSlugField,
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
      }],
    },
    {
      name: 'editorChecklist',
      type: 'ui',
      admin: { position: 'sidebar', disableListColumn: true, components: { Field: '/admin/EditorChecklist#PostChecklistField' } },
    },
  ],
};
