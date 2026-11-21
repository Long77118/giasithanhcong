import path from 'node:path';
import type { CollectionConfig } from 'payload';
import { isAdmin } from './access';
import { safeRevalidateTags } from '../lib/revalidate';

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Tài liệu PDF', plural: 'Tài liệu PDF' },
  admin: {
    group: 'Nội dung',
    useAsTitle: 'title',
    description: 'Tài liệu công khai để khách tải về: catalog và bảng giá dạng PDF.',
  },
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: {
    staticDir: path.resolve(process.cwd(), 'documents'),
    mimeTypes: ['application/pdf'],
  },
  hooks: {
    afterChange: [() => safeRevalidateTags(['products', 'catalog'])],
    afterDelete: [() => safeRevalidateTags(['products', 'catalog'])],
  },
  fields: [
    // Keep the storage schema identical on local Node and Workers using the existing R2 bucket.
    { name: '_objectKey', type: 'text', admin: { hidden: true, readOnly: true } },
    { name: 'prefix', type: 'text', defaultValue: 'documents', admin: { hidden: true, readOnly: true } },
    {
      name: 'title', label: 'Tên tài liệu', type: 'text', required: true,
      admin: { description: 'Tên hiển thị trên liên kết tải PDF, ví dụ Catalog chai nhựa.' },
    },
  ],
};
