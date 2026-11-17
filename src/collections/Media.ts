import path from 'node:path';
import type { CollectionConfig } from 'payload';
import { isAuthenticated } from './access';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Thư viện ảnh',
    plural: 'Thư viện ảnh',
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 480,
        height: 360,
        position: 'centre',
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Văn bản thay thế (Alt SEO)',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      label: 'Chú thích ảnh',
      type: 'text',
    },
  ],
};
