import type { GlobalConfig } from 'payload';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAuthenticated } from '../collections/access';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cấu hình website & Liên hệ',
  access: {
    read: () => true,
    update: isAuthenticated,
  },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTags(
          ['site-settings', 'catalog', 'blog'],
          ['/', '/san-pham', '/blog', '/gioi-thieu', '/lien-he'],
        );
      },
    ],
  },
  fields: [
    {
      name: 'brandName',
      label: 'Tên thương hiệu',
      type: 'text',
      required: true,
      defaultValue: 'Bao Bì An Phát',
    },
    {
      name: 'tagline',
      label: 'Giới thiệu ngắn thương hiệu',
      type: 'textarea',
      defaultValue:
        'Đơn vị phân phối sỉ ly nhựa, chai PET, hũ thực phẩm, hộp mang đi, túi đóng gói và bao bì giấy dùng một lần.',
    },
    {
      name: 'logo',
      label: 'Logo thương hiệu',
      type: 'upload',
      relationTo: 'media',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'hotline',
          label: 'Số Hotline bán sỉ',
          type: 'text',
          admin: {
            width: '50%',
            description:
              'Để trống nếu chưa cấu hình; giao diện sẽ hiển thị trạng thái chưa cấu hình thay vì dẫn sang đơn vị khác.',
          },
        },
        {
          name: 'zaloUrl',
          label: 'Đường dẫn Zalo OA / Zalo tư vấn',
          type: 'text',
          admin: {
            width: '50%',
            placeholder: 'https://zalo.me/...',
            description:
              'Chỉ chấp nhận URL https://zalo.me/...; để trống nếu chưa cấu hình.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'Email tiếp nhận báo giá',
          type: 'email',
          admin: { width: '50%' },
        },
        {
          name: 'workingHours',
          label: 'Giờ làm việc',
          type: 'text',
          defaultValue: 'Thứ 2 – Thứ 7: 08:00 – 17:30',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'address',
      label: 'Địa chỉ kho & văn phòng',
      type: 'textarea',
    },
    {
      name: 'sampleNotice',
      label: 'Ghi chú dữ liệu minh họa',
      type: 'textarea',
      defaultValue:
        'Website nền tảng đang sử dụng dữ liệu sản phẩm, bài viết và thông tin liên hệ minh họa phục vụ kiểm thử và audit.',
    },
    {
      name: 'defaultSeoTitle',
      label: 'Tiêu đề SEO mặc định',
      type: 'text',
      defaultValue: 'Bao Bì An Phát – Tổng Kho Sỉ Ly, Hộp Nhựa & Bao Bì Giấy',
    },
    {
      name: 'defaultSeoDescription',
      label: 'Mô tả SEO mặc định',
      type: 'textarea',
      defaultValue:
        'Cung cấp sỉ ly nhựa PET/PP, chai lọ, hũ thực phẩm, hộp cơm, túi đóng gói và bao bì giấy dùng một lần cho quán cà phê, nhà hàng và đại lý.',
    },
    {
      name: 'defaultOgImage',
      label: 'Ảnh Open Graph mặc định',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};
