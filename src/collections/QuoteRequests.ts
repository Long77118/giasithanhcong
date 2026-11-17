import type { CollectionConfig } from 'payload';
import { isAuthenticated } from './access';

export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  labels: {
    singular: 'Yêu cầu báo giá',
    plural: 'Yêu cầu báo giá',
  },
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: [
      'customerName',
      'phone',
      'quantity',
      'productNameSnapshot',
      'status',
      'createdAt',
    ],
  },
  access: {
    // Public visitors submit via POST /api/bao-gia (validated + anti-spam + Local API).
    // Direct collection read/list/update/delete/create via Payload REST API requires authentication.
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: 'product',
      label: 'Sản phẩm quan tâm',
      type: 'relationship',
      relationTo: 'products',
    },
    {
      name: 'productNameSnapshot',
      label: 'Tên / Mã sản phẩm tại thời điểm gửi',
      type: 'text',
    },
    {
      name: 'quantity',
      label: 'Số lượng dự kiến',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customerName',
          label: 'Tên khách hàng / Người liên hệ',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'phone',
          label: 'Số điện thoại',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'Email (tùy chọn)',
          type: 'email',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'companyName',
          label: 'Tên cửa hàng / Doanh nghiệp (tùy chọn)',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'message',
      label: 'Nội dung yêu cầu chi tiết',
      type: 'textarea',
      required: true,
    },
    {
      name: 'sourceUrl',
      label: 'Trang nguồn gửi yêu cầu',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      label: 'Trạng thái xử lý',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'Mới tiếp nhận', value: 'new' },
        { label: 'Đã liên hệ', value: 'contacted' },
        { label: 'Đã gửi báo giá', value: 'quoted' },
        { label: 'Hoàn tất / Đóng', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
