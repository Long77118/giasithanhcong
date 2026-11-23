import type { GlobalConfig, RelationshipFieldSingleValidation } from 'payload';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin } from '../collections/access';
import { normalizeFacebookPageUrl } from '../lib/facebook-page';
import { normalizeHomePromotionHref } from '../lib/home-promotions';
import { normalizeContactMapEmbedUrl } from '../lib/contact-map';

const validateShelfCategory: RelationshipFieldSingleValidation = (value, { siblingData }) =>
  Boolean(value) || (siblingData as { enabled?: boolean } | undefined)?.enabled === false || 'Chọn danh mục cho khối đang hiển thị.';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cấu hình website & Liên hệ',
  admin: { group: 'Cài đặt' },
  access: {
    read: () => true,
    update: isAdmin,
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
      label: 'Trang chủ · Kệ sản phẩm theo danh mục',
      type: 'collapsible',
      fields: [
        {
          name: 'homeCategoryShelvesEnabled', label: 'Hiển thị kệ danh mục trên trang chủ', type: 'checkbox', defaultValue: true,
        },
        {
          name: 'homeCategoryShelves', label: 'Các danh mục hiển thị',
          labels: { singular: 'Danh mục', plural: 'Danh mục' }, type: 'array', maxRows: 6,
          admin: {
            initCollapsed: true,
            description: 'Kéo để đổi thứ tự, tối đa 6 khối. Để trống sẽ lấy 3 danh mục gốc đã xuất bản đầu tiên. Muốn ẩn toàn bộ, tắt công tắc phía trên. Mỗi khối tự lấy tối đa 12 sản phẩm, 4 sản phẩm mỗi slide; các khối chuyển cùng nhịp.',
          },
          fields: [
            { name: 'enabled', label: 'Hiển thị khối này', type: 'checkbox', defaultValue: true },
            {
              name: 'category', label: 'Chọn danh mục sản phẩm', type: 'relationship', relationTo: 'product-categories',
              filterOptions: { status: { equals: 'published' } },
              validate: validateShelfCategory,
              admin: { description: 'Bao gồm sản phẩm thuộc danh mục con đã xuất bản. Khối không có sản phẩm sẽ tự ẩn.' },
            },
            { name: 'title', label: 'Tiêu đề riêng (tùy chọn)', type: 'text', maxLength: 80, admin: { description: 'Để trống để dùng tên danh mục hiện tại.' } },
          ],
        },
      ],
    },
    {
      label: 'Trang chủ · Banner theo nhu cầu',
      type: 'collapsible',
      fields: [
        {
          name: 'homePromotions',
          label: 'Banner theo nhu cầu',
          labels: { singular: 'Banner', plural: 'Banner' },
          type: 'array',
          maxRows: 4,
          admin: {
            initCollapsed: true,
            components: { RowLabel: '/admin/HomePromotionLabel' },
            description: 'Tối đa 4 ô bên dưới dải danh mục. Kéo các ô để đổi thứ tự hiển thị.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'enabled', label: 'Hiển thị trên trang chủ', type: 'checkbox', defaultValue: true, admin: { width: '50%' } },
                {
                  name: 'tone', label: 'Màu nền', type: 'select', defaultValue: 'mint', required: true,
                  options: [
                    { label: 'Xanh bạc hà', value: 'mint' },
                    { label: 'Xanh nhạt', value: 'ice' },
                    { label: 'Cam đào nhạt', value: 'peach' },
                    { label: 'Kem cát', value: 'sand' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
            { name: 'title', label: 'Tiêu đề', type: 'text', required: true, maxLength: 90 },
            { name: 'description', label: 'Mô tả ngắn (tùy chọn)', type: 'text', maxLength: 120 },
            {
              name: 'image', label: 'Ảnh bao bì', type: 'upload', relationTo: 'media', required: true,
              admin: { description: 'Chọn từ thư viện hoặc tải ảnh mới. Ưu tiên ảnh tách nền PNG/WebP.' },
            },
            { name: 'buttonLabel', label: 'Chữ trên nút', type: 'text', required: true, defaultValue: 'Xem sản phẩm', maxLength: 40 },
            {
              name: 'url', label: 'Trang mở khi bấm', type: 'text', required: true,
              validate: (value: unknown) => !!normalizeHomePromotionHref(value)
                || 'Nhập đường dẫn bắt đầu bằng / hoặc URL http(s) hợp lệ.',
              hooks: { beforeChange: [({ value }) => normalizeHomePromotionHref(value) ?? value] },
              admin: {
                placeholder: '/danh-muc/ly-coc-dung-mot-lan',
                description: 'Dẫn tới danh mục, trang đã lọc như /san-pham?q=Ly+Giấy, hoặc URL đầy đủ.',
              },
            },
          ],
        },
      ],
    },
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
      name: 'secondaryHotline',
      label: 'Số điện thoại bán sỉ thứ hai (tùy chọn)',
      type: 'text',
      admin: {
        placeholder: 'Ví dụ: 0900 123 456',
        description: 'Hiển thị cùng hotline chính trong header và menu điện thoại. Để trống để ẩn.',
      },
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
      name: 'contactMapEmbedUrl',
      label: 'Bản đồ trang Liên hệ (tùy chọn)',
      type: 'text',
      maxLength: 8000,
      admin: {
        placeholder: 'Dán link hoặc mã nhúng từ Google Maps',
        description: 'Trong Google Maps: Chia sẻ → Nhúng bản đồ → Sao chép HTML, rồi dán vào đây. Để trống để ẩn bản đồ. Bản đồ chỉ tải khi khách bấm mở.',
      },
      validate: (value: unknown) => value == null || value === '' || normalizeContactMapEmbedUrl(value) !== null
        || 'Dán mã nhúng Google Maps từ mục Chia sẻ → Nhúng bản đồ, không dùng link chia sẻ rút gọn.',
      hooks: { beforeChange: [({ value }) => normalizeContactMapEmbedUrl(value) ?? value] },
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
    {
      name: 'facebookPages',
      label: 'Fanpage Facebook',
      labels: { singular: 'Fanpage Facebook', plural: 'Fanpage Facebook' },
      type: 'array',
      admin: {
        description: 'Các fanpage công khai hiển thị theo thứ tự dưới đây ở cột trái trang chủ.',
        initCollapsed: true,
      },
      fields: [
        { name: 'name', label: 'Tên hiển thị', type: 'text', required: true, maxLength: 100 },
        {
          name: 'url',
          label: 'Đường dẫn fanpage',
          type: 'text',
          required: true,
          admin: { placeholder: 'https://www.facebook.com/tenfanpage' },
          validate: (value: unknown) => normalizeFacebookPageUrl(value) !== null
            || 'Nhập URL HTTPS của trang Facebook công khai, ví dụ https://www.facebook.com/tenfanpage.',
        },
      ],
    },
  ],
};
