import type { CollectionConfig } from 'payload';
import { generateInitialSlug, guardPublicSlug, publicSlugField } from '../lib/public-slug-hooks';
import { publicContentPath } from '../lib/slug';
import { safeRevalidateTags } from '../lib/revalidate';
import { isAdmin, publishedOrAdmin } from './access';
import { getYouTubeID } from '../lib/youtube';
import { previewUrl } from '../lib/preview';
import { duplicateProductSKU, validateProductShortDescription } from '../lib/product-admin';
export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Sản phẩm bán sỉ',
    plural: 'Sản phẩm bán sỉ',
  },
  admin: {
    group: 'Danh mục và nội dung',
    useAsTitle: 'name',
    defaultColumns: ['sku', 'name', 'category', 'minOrderQty', 'featured', 'status', 'updatedAt'],
    listSearchableFields: ['name', 'sku', 'brandName'],
    preview: (doc) => previewUrl('products', doc.id),
    description:
      'Nhập lần lượt các tab và bấm Lưu trước khi Xem trước. Xem trước dùng dữ liệu đã lưu, chỉ dành cho quản trị viên; khách không xem được bản nháp.',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [guardPublicSlug],
    beforeValidate: [generateInitialSlug('name')],
    afterChange: [
      ({ doc, previousDoc }) => {
        const currentPath = publicContentPath('products', doc.slug);
        const changedPaths =
          previousDoc && previousDoc.slug !== doc.slug
            ? [publicContentPath('products', previousDoc.slug), currentPath]
            : [currentPath];
        safeRevalidateTags(
          ['catalog', 'products', 'sitemap'],
          ['/', '/san-pham', ...changedPaths, '/sitemap.xml'],
        );
      },
    ],
    afterDelete: [
      ({ doc }) => {
        safeRevalidateTags(
          ['catalog', 'products', 'sitemap'],
          ['/', '/san-pham', publicContentPath('products', doc.slug), '/sitemap.xml'],
        );
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Cơ bản',
          fields: [
            {
              name: 'name',
              label: 'Tên sản phẩm',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Tên rõ loại sản phẩm, dung tích hoặc quy cách chính; không nhồi từ khóa.',
                placeholder: 'Ví dụ: Ly nhựa PET 500ml nắp cầu',
              },
            },
            {
              name: 'brandName',
              label: 'Thương hiệu sản phẩm',
              type: 'text',
              admin: {
                description:
                  'Thương hiệu của sản phẩm, không phải tên cửa hàng. Để trống nếu chưa xác định được.',
                placeholder: 'Ví dụ: tên thương hiệu ghi trên bao bì',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  ...publicSlugField,
                  admin: {
                    ...publicSlugField.admin,
                    width: '50%',
                  },
                },
                {
                  name: 'sku',
                  label: 'Mã sản phẩm (SKU)',
                  type: 'text',
                  required: true,
                  unique: true,
                  index: true,
                  hooks: { beforeDuplicate: [({ value }) => duplicateProductSKU(value)] },
                  admin: {
                    width: '50%',
                    description:
                      'Mã riêng của từng sản phẩm, không trùng mã đã có. Bản nhân đôi được cấp hậu tố riêng.',
                    placeholder: 'Ví dụ: LY-PET-500-NC',
                  },
                },
              ],
            },
            {
              name: 'category',
              label: 'Danh mục sản phẩm',
              type: 'relationship',
              relationTo: 'product-categories',
              required: true,
              index: true,
            },
            {
              name: 'shortDescription',
              label: 'Mô tả ngắn',
              type: 'textarea',
              required: true,
              validate: validateProductShortDescription,
              admin: {
                description:
                  'Viết khoảng 150–200 ký tự, nêu loại sản phẩm, công dụng và quy cách chính.',
                placeholder:
                  'Ví dụ: Ly PET trong suốt 500ml dùng cho đồ uống mang đi, phối nắp cầu hoặc nắp bằng cùng cỡ.',
                components: { Description: '/admin/ProductShortDescription' },
              },
            },
            {
              name: 'availability',
              label: 'Tình trạng cung cấp',
              type: 'select',
              defaultValue: 'in_stock',
              options: [
                { label: 'Còn hàng', value: 'in_stock' },
                { label: 'Đặt theo yêu cầu', value: 'made_to_order' },
                { label: 'Ngừng cung cấp', value: 'discontinued' },
              ],
              admin: {
                description: 'Tình trạng hiện tại của sản phẩm. Có thể để trống để ẩn nhãn.',
              },
            },
          ],
        },
        {
          label: 'Hình ảnh',
          fields: [
            {
              name: 'images',
              label: 'Bộ ảnh sản phẩm',
              labels: { singular: 'Ảnh', plural: 'Ảnh' },
              type: 'array',
              minRows: 1,
              admin: {
                initCollapsed: true,
                description:
                  'Ảnh đầu tiên là ảnh chính và ảnh chia sẻ mặc định khi chưa chọn ảnh trong tab SEO. Kéo thả để đổi thứ tự; ghi chú giúp phân biệt góc chụp.',
                components: { RowLabel: '/admin/ProductRowLabels#ProductImageLabel' },
              },
              fields: [
                {
                  name: 'image',
                  label: 'Hình ảnh',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  label: 'Ghi chú góc chụp / quy cách',
                  type: 'text',
                },
              ],
            },
            {
              name: 'documents',
              label: 'Bảng giá và catalog (PDF)',
              type: 'upload',
              relationTo: 'documents',
              hasMany: true,
              admin: {
                description:
                  'Chọn hoặc tải tài liệu PDF công khai. Không dùng thư viện ảnh cho tài liệu.',
              },
            },
          ],
        },
        {
          label: 'Thông số và đóng gói',
          fields: [
            {
              name: 'specs',
              label: 'Thông số kỹ thuật',
              labels: { singular: 'Thông số', plural: 'Thông số' },
              type: 'array',
              admin: {
                initCollapsed: true,
                description:
                  'Tên thường dùng: Dung tích, Chất liệu, Màu sắc, Kiểu nắp, Kích thước. Chỉ thêm thông số có dữ liệu; chọn tối đa 4 dòng cho nhãn nhìn nhanh.',
                components: { RowLabel: '/admin/ProductRowLabels#ProductSpecLabel' },
              },
              validate: (value: unknown) =>
                !Array.isArray(value) ||
                value.filter((item) => item?.showInQuickFacts === true).length <= 4 ||
                'Chỉ chọn tối đa 4 thông số hiện ở nhãn nhìn nhanh.',
              fields: [
                {
                  name: 'label',
                  label: 'Tên thông số',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'value',
                  label: 'Giá trị',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'showInQuickFacts',
                  label: 'Hiện ở nhãn nhìn nhanh',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Đưa thông số này lên cạnh tiêu đề sản phẩm (tối đa 4 nhãn).',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'packagingSpec',
                  label: 'Quy cách đóng gói',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                    placeholder: 'Ví dụ: 1.000 cái / thùng (20 lốc x 50 cái)',
                  },
                },
                {
                  name: 'minOrderQty',
                  label: 'Số lượng đặt tối thiểu (MOQ)',
                  type: 'number',
                  min: 1,
                  admin: {
                    width: '25%',
                  },
                },
                {
                  name: 'minOrderUnit',
                  label: 'Đơn vị MOQ',
                  type: 'text',
                  defaultValue: 'thùng',
                  admin: {
                    width: '25%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Nội dung',
          fields: [
            {
              name: 'description',
              label: 'Nội dung chi tiết',
              type: 'richText',
            },
            {
              name: 'benefits',
              label: 'Ưu điểm',
              type: 'text',
              hasMany: true,
              admin: { description: 'Mỗi mục là một ưu điểm đã được xác nhận của sản phẩm.' },
            },
            {
              name: 'applications',
              label: 'Ứng dụng',
              type: 'text',
              hasMany: true,
              admin: { description: 'Mỗi mục là một cách sử dụng hoặc nhóm khách hàng phù hợp.' },
            },
            {
              name: 'faq',
              label: 'Câu hỏi thường gặp',
              labels: { singular: 'Câu hỏi', plural: 'Câu hỏi' },
              type: 'array',
              admin: {
                initCollapsed: true,
                description: 'Thêm câu hỏi và câu trả lời thực tế; để trống để ẩn khối.',
              },
              fields: [
                { name: 'question', label: 'Câu hỏi', type: 'text', required: true },
                { name: 'answer', label: 'Câu trả lời', type: 'textarea', required: true },
              ],
            },
            {
              name: 'videos',
              label: 'Video sản phẩm',
              labels: { singular: 'Video', plural: 'Video' },
              type: 'array',
              admin: {
                initCollapsed: true,
                description:
                  'Chỉ nhận liên kết video YouTube. Trình phát chỉ nạp khi khách bấm xem.',
              },
              fields: [
                {
                  name: 'youtubeUrl',
                  label: 'Liên kết YouTube',
                  type: 'text',
                  required: true,
                  validate: (value: unknown) =>
                    getYouTubeID(value) !== null ||
                    'Nhập URL video YouTube hợp lệ (watch, youtu.be, shorts hoặc embed).',
                },
                { name: 'title', label: 'Tiêu đề video', type: 'text', required: true },
                {
                  name: 'description',
                  label: 'Tóm tắt nội dung video',
                  type: 'textarea',
                  required: true,
                  admin: { description: 'Mô tả bằng chữ để khách hiểu nội dung trước khi xem.' },
                },
                {
                  name: 'thumbnail',
                  label: 'Ảnh thu nhỏ (tùy chọn)',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Để trống để dùng ảnh thu nhỏ của video YouTube.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Liên kết',
          fields: [
            {
              name: 'relatedProducts',
              label: 'Sản phẩm liên quan',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
            },
            {
              name: 'relatedPosts',
              label: 'Bài viết liên quan',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              admin: {
                description:
                  'Chọn các bài viết hỗ trợ khách tìm hiểu sản phẩm. Chỉ bài đã xuất bản được hiển thị.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'editorChecklist',
      type: 'ui',
      admin: { position: 'sidebar', disableListColumn: true, components: { Field: '/admin/EditorChecklist#ProductChecklistField' } },
    },
    {
      name: 'featured',
      label: 'Sản phẩm nổi bật trang chủ',
      type: 'checkbox',
      defaultValue: false,
      hooks: { beforeDuplicate: [() => false] },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      label: 'Trạng thái xuất bản',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      hooks: { beforeDuplicate: [() => 'draft'] },
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
};
