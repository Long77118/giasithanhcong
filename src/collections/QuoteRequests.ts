import type { CollectionConfig } from 'payload';
import { advanceQuoteStatus } from '@/lib/admin-quote-endpoint';
import { quoteStages } from '@/lib/admin-quotes';
import { isAdmin } from './access';

export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  labels: {
    singular: 'Yêu cầu báo giá',
    plural: 'Yêu cầu báo giá',
  },
  admin: {
    group: 'Bán hàng',
    useAsTitle: 'customerName',
    components: { beforeListTable: ['/admin/QuoteWorkflows#QuoteQuickFilters'] },
    defaultColumns: [
      'customerName',
      'phone',
      'productNameSnapshot',
      'quantity',
      'status',
      'createdAt',
      'quoteWorkflow',
    ],
  },
  endpoints: [advanceQuoteStatus],
  access: {
    // Public visitors submit via POST /api/bao-gia (validated + anti-spam + Local API).
    // Direct collection read/list/update/delete/create via Payload REST API requires an admin account.
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'quoteWorkflow',
      label: 'Thao tác nhanh',
      type: 'ui',
      admin: { components: { Field: '/admin/QuoteWorkflows#QuoteStageField', Cell: '/admin/QuoteCells#QuoteActionsCell' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customerName',
          label: 'Khách hàng',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            components: { Cell: '/admin/QuoteCells#QuoteCustomerCell' },
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
          label: 'Tên cửa hàng hoặc doanh nghiệp (tùy chọn)',
          type: 'text',
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
          name: 'product',
          label: 'Sản phẩm quan tâm',
          type: 'relationship',
          relationTo: 'products',
          admin: { width: '50%' },
        },
        {
          name: 'productNameSnapshot',
          label: 'Sản phẩm ghi trong yêu cầu',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Tên và mã sản phẩm tại thời điểm khách gửi yêu cầu.',
            components: { Cell: '/admin/QuoteCells#QuoteProductCell' },
          },
        },
      ],
    },
    {
      name: 'quantity',
      label: 'Số lượng',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      label: 'Nội dung yêu cầu',
      type: 'textarea',
      required: true,
      admin: { rows: 6 },
    },
    {
      name: 'sourceUrl',
      label: 'Trang khách gửi yêu cầu',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [...quoteStages],
      admin: {
        position: 'sidebar',
        components: { Cell: '/admin/QuoteCells#QuoteStatusCell' },
      },
    },
    {
      name: 'createdAt',
      label: 'Thời gian nhận',
      type: 'date',
      index: true,
      admin: { disableBulkEdit: true, hidden: true, components: { Cell: '/admin/QuoteCells#QuoteDateCell' } },
    },
  ],
};
