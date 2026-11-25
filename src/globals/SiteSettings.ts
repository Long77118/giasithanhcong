import { ValidationError, type GlobalConfig, type RelationshipFieldSingleValidation } from 'payload';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin } from '../collections/access';
import { normalizeFacebookPageUrl } from '../lib/facebook-page';
import { normalizeHomePromotionHref } from '../lib/home-promotions';
import { normalizeContactMapEmbedUrl } from '../lib/contact-map';
import {
  getSeasonalScheduleError,
  normalizeSeasonalAnnouncementHref,
  seasonalAnnouncementMaxLength,
  type SeasonalThemeConfig,
} from '../lib/seasonal-theme';

const validateShelfCategory: RelationshipFieldSingleValidation = (value, { siblingData }) =>
  Boolean(value) || (siblingData as { enabled?: boolean } | undefined)?.enabled === false || 'Chọn danh mục cho khối đang hiển thị.';

const showSeasonalOptions = (_data: unknown, siblingData: SeasonalThemeConfig) => siblingData?.enabled === true;

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Cấu hình website và liên hệ',
  admin: { group: 'Cài đặt' },
  access: {
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, req }) => {
        if (!data?.seasonalTheme || typeof data.seasonalTheme !== 'object') return data;
        const config: SeasonalThemeConfig = { ...originalDoc?.seasonalTheme, ...data.seasonalTheme };
        const errors = [];
        const schedule = getSeasonalScheduleError(config);
        if (schedule) errors.push({ path: `seasonalTheme.${schedule.field}`, message: schedule.message });
        if (typeof config.announcementText === 'string' && config.announcementText.length > seasonalAnnouncementMaxLength) {
          errors.push({ path: 'seasonalTheme.announcementText', message: 'Nhập tối đa 100 ký tự cho dải thông báo.' });
        }
        if (typeof config.announcementHref === 'string' && config.announcementHref.trim() && !normalizeSeasonalAnnouncementHref(config.announcementHref)) {
          errors.push({ path: 'seasonalTheme.announcementHref', message: 'Nhập đường dẫn nội bộ bắt đầu bằng / hoặc địa chỉ HTTPS hợp lệ.' });
        }
        if (errors.length) throw new ValidationError({ errors, global: 'site-settings', req }, req.t);
        return data;
      },
    ],
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
      name: 'seasonalTheme', label: 'Giao diện theo mùa', type: 'group',
      admin: { description: 'Trang trí website công khai theo lịch đã chọn, tính theo giờ Việt Nam.' },
      fields: [
        {
          name: 'enabled', label: 'Bật giao diện theo mùa', type: 'checkbox', defaultValue: false,
          admin: { description: 'Bật để dùng chủ đề và các hiệu ứng đã chọn. Tắt để dừng toàn bộ.' },
        },
        {
          name: 'theme', label: 'Chủ đề', type: 'select', defaultValue: 'christmas',
          options: [{ label: 'Giáng sinh', value: 'christmas' }],
          admin: { condition: showSeasonalOptions, isClearable: false },
        },
        {
          type: 'row',
          admin: { condition: showSeasonalOptions },
          fields: [
            {
              name: 'startsOn', label: 'Ngày bắt đầu', type: 'text', maxLength: 10,
              admin: {
                width: '50%', components: { Field: '/admin/SeasonalDateField' },
                description: 'Bắt đầu từ 00:00 giờ Việt Nam. Để trống để bật ngay.',
              },
            },
            {
              name: 'endsOn', label: 'Ngày kết thúc', type: 'text', maxLength: 10,
              admin: {
                width: '50%', components: { Field: '/admin/SeasonalDateField' },
                description: 'Hiển thị hết ngày đã chọn. Để trống để duy trì đến khi tắt thủ công.',
              },
            },
          ],
        },
        {
          name: 'intensity', label: 'Mức tuyết rơi', type: 'select', defaultValue: 'light',
          options: [{ label: 'Nhẹ', value: 'light' }, { label: 'Vừa', value: 'medium' }, { label: 'Mạnh', value: 'strong' }],
          admin: { condition: showSeasonalOptions, isClearable: false, description: 'Màn hình nhỏ sẽ dùng ít hạt tuyết hơn.' },
        },
        { name: 'snowEnabled', label: 'Tuyết rơi', type: 'checkbox', defaultValue: true, admin: { condition: showSeasonalOptions } },
        { name: 'lightsEnabled', label: 'Dây đèn đầu trang', type: 'checkbox', defaultValue: true, admin: { condition: showSeasonalOptions } },
        { name: 'decorationsEnabled', label: 'Trang trí Giáng sinh', type: 'checkbox', defaultValue: true, admin: { condition: showSeasonalOptions } },
        { name: 'scrollEffectsEnabled', label: 'Hiệu ứng khi cuộn', type: 'checkbox', defaultValue: true, admin: { condition: showSeasonalOptions } },
        { name: 'announcementEnabled', label: 'Dải thông báo', type: 'checkbox', defaultValue: false, admin: { condition: showSeasonalOptions } },
        {
          name: 'announcementText', label: 'Nội dung thông báo', type: 'text', maxLength: seasonalAnnouncementMaxLength,
          admin: { condition: showSeasonalOptions, description: 'Tối đa 100 ký tự. Để trống nếu muốn ẩn dải thông báo.' },
        },
        {
          name: 'announcementHref', label: 'Đường dẫn thông báo', type: 'text',
          admin: { condition: showSeasonalOptions, description: 'Đường dẫn nội bộ hoặc HTTPS. Có thể để trống.', placeholder: '/san-pham' },
        },
      ],
    },
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
            description: 'Bạn có thể chọn tối đa 6 danh mục và kéo để đổi thứ tự. Để trống sẽ dùng 3 danh mục gốc đã xuất bản đầu tiên. Tắt công tắc phía trên để ẩn toàn bộ. Mỗi khối lấy tối đa 12 sản phẩm và tự chuyển theo nhóm 4 sản phẩm.',
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
          label: 'Số điện thoại bán sỉ',
          type: 'text',
          admin: {
            width: '50%',
            description:
              'Nhập số chính khách có thể gọi. Nếu để trống, website sẽ báo rằng số điện thoại chưa được thiết lập.',
          },
        },
        {
          name: 'zaloUrl',
          label: 'Liên kết Zalo tư vấn',
          type: 'text',
          admin: {
            width: '50%',
            placeholder: 'https://zalo.me/...',
            description:
              'Dán liên kết bắt đầu bằng https://zalo.me/ để khách nhắn tin. Bạn có thể để trống nếu chưa có.',
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
        description: 'Hiển thị cạnh số chính ở đầu trang và trong menu điện thoại. Để trống để ẩn.',
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
      label: 'Địa chỉ kho và văn phòng',
      type: 'textarea',
    },
    {
      name: 'contactMapEmbedUrl',
      label: 'Bản đồ trang Liên hệ (tùy chọn)',
      type: 'text',
      maxLength: 8000,
      admin: {
        placeholder: 'Dán liên kết nhúng hoặc mã HTML từ Google Maps',
        description: 'Trong Google Maps, mở Chia sẻ → Nhúng bản đồ → Sao chép HTML rồi dán vào đây. Bản đồ chỉ tải khi khách bấm mở. Để trống để ẩn bản đồ.',
      },
      validate: (value: unknown) => value == null || value === '' || normalizeContactMapEmbedUrl(value) !== null
        || 'Hãy lấy mã hoặc liên kết nhúng từ Chia sẻ → Nhúng bản đồ trong Google Maps.',
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
      label: 'Ảnh chia sẻ mặc định',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'facebookPages',
      label: 'Trang Facebook',
      labels: { singular: 'trang Facebook', plural: 'trang Facebook' },
      type: 'array',
      admin: {
        description: 'Các trang Facebook công khai xuất hiện bên dưới mục bài viết trên trang chủ. Bạn có thể kéo để đổi thứ tự.',
        initCollapsed: true,
      },
      fields: [
        { name: 'name', label: 'Tên hiển thị', type: 'text', required: true, maxLength: 100 },
        {
          name: 'url',
          label: 'Đường dẫn trang Facebook',
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
