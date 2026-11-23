import path from 'node:path';
import type { CollectionConfig } from 'payload';
import { isAdmin } from './access';
import { safeRevalidateTags } from '../lib/revalidate';
import { isCloudflareTarget } from '../lib/deployment';
import { imageUploadConfig } from '../lib/image-upload-config';
import { validateMediaUpload } from '../lib/media-upload-validation';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Thư viện ảnh',
    plural: 'Thư viện ảnh',
  },
  admin: { group: 'Nội dung' },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeOperation: [validateMediaUpload],
    afterChange: [() => safeRevalidateTags(['site-settings'])],
    afterDelete: [() => safeRevalidateTags(['site-settings'])],
  },
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    mimeTypes: [...imageUploadConfig.allowedMimeTypes],
    adminThumbnail: isCloudflareTarget() ? undefined : 'thumbnail',
    crop: !isCloudflareTarget(),
    focalPoint: !isCloudflareTarget(),
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
      name: 'uploadOptimization',
      label: 'Tối ưu ảnh',
      type: 'ui',
      admin: { disableListColumn: true, components: { Field: '/admin/MediaUploadOptions' } },
    },
    // R2 injects this same optional field. Keep the Node and Workers database schemas equal.
    { name: '_objectKey', type: 'text', admin: { hidden: true, readOnly: true } },
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
