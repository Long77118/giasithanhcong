import path from 'node:path';
import type { CollectionConfig } from 'payload';
import { isAdmin } from './access';
import { safeRevalidateTags } from '../lib/revalidate';

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Tài liệu PDF', plural: 'Tài liệu PDF' },
  admin: {
    group: 'Thư viện',
    useAsTitle: 'title',
    description: 'Bạn có thể tải lên bảng giá và danh mục sản phẩm dạng PDF để khách tải về.',
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
    { name: '_objectKey', label: 'Mã lưu trữ', type: 'text', admin: { hidden: true, readOnly: true } },
    { name: 'prefix', label: 'Thư mục lưu tệp', type: 'text', defaultValue: 'documents', admin: { hidden: true, readOnly: true } },
    {
      name: 'title', label: 'Tên tài liệu', type: 'text', required: true,
      admin: { description: 'Khách sẽ thấy tên này khi tải PDF, ví dụ Danh mục chai nhựa.' },
    },
  ],
};
