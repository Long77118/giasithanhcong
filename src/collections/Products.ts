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
      'Bạn có thể điền lần lượt theo từng tab. Bấm Lưu trước khi Xem trước để kiểm tra bản đã lưu. Chỉ quản trị viên xem được bản nháp.',
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
                  'Bạn nên nêu loại sản phẩm, dung tích hoặc quy cách chính để khách dễ nhận ra.',
                placeholder: 'Ví dụ: Ly nhựa PET 500ml nắp cầu',
              },
            },
            {
              name: 'brandName',
              label: 'Thương hiệu sản phẩm',
              type: 'text',
              admin: {
                description:
                  'Nhập tên thương hiệu ghi trên sản phẩm. Bạn có thể để trống nếu chưa rõ.',
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
                      'Mỗi sản phẩm cần một mã riêng. Khi tạo bản sao, hệ thống sẽ thêm đuôi mới vào mã.',
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
                  'Ảnh đầu tiên là ảnh chính và được dùng khi chia sẻ nếu tab SEO chưa có ảnh. Bạn có thể kéo thả để đổi thứ tự và ghi chú để phân biệt góc chụp.',
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
                  label: 'Ghi chú về góc chụp hoặc quy cách',
                  type: 'text',
                },
              ],
            },
            {
              name: 'documents',
              label: 'Bảng giá và danh mục sản phẩm (PDF)',
              type: 'upload',
              relationTo: 'documents',
              hasMany: true,
              admin: {
                description:
                  'Chọn từ thư viện tài liệu hoặc tải lên tệp PDF mà khách có thể tải về.',
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
                  'Thêm thông số mà bạn đã có dữ liệu, ví dụ dung tích, chất liệu, màu sắc, kiểu nắp hoặc kích thước. Chọn tối đa 4 thông số để hiện cạnh tên sản phẩm.',
                components: { RowLabel: '/admin/ProductRowLabels#ProductSpecLabel' },
              },
              validate: (value: unknown) =>
                !Array.isArray(value) ||
                value.filter((item) => item?.showInQuickFacts === true).length <= 4 ||
                'Bạn đã chọn hơn 4 thông số. Hãy bỏ bớt mục hiển thị cạnh tên sản phẩm.',
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
                  label: 'Hiện cạnh tên sản phẩm',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Bạn có thể chọn tối đa 4 thông số để khách xem nhanh.',
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
                  label: 'Đơn vị đặt tối thiểu',
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
                description: 'Thêm câu hỏi khách thường hỏi và câu trả lời của bạn. Để trống nếu chưa có.',
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
                  'Dán liên kết YouTube. Video chỉ tải khi khách bấm xem.',
              },
              fields: [
                {
                  name: 'youtubeUrl',
                  label: 'Liên kết YouTube',
                  type: 'text',
                  required: true,
                  validate: (value: unknown) =>
                    getYouTubeID(value) !== null ||
                    'Hãy dán liên kết video YouTube hợp lệ, ví dụ https://youtu.be/VIDEO_ID.',
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
      label: 'Hiện trong sản phẩm nổi bật trên trang chủ',
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
        { label: 'Bản nháp', value: 'draft' },
        { label: 'Đã xuất bản', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
