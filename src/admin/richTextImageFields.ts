import type { Field, NumberFieldSingleValidation } from 'payload';
import { asRecord } from '../lib/rich-text';
import { isRichTextImageWidthUnit, richTextImageLayoutConfig } from '../lib/rich-text-image-layout-config';

const { defaultAlignment, defaultSize, presets, customLimits } = richTextImageLayoutConfig;
const isCustomSize = (_: unknown, siblingData: { imageSize?: unknown }) => siblingData.imageSize === 'custom';

const validateCustomWidth: NumberFieldSingleValidation = (value, { siblingData }) => {
  const fields = asRecord(siblingData);
  if (fields?.imageSize !== 'custom') return true;
  const unit = fields.customWidthUnit ?? 'percent';
  if (!isRichTextImageWidthUnit(unit)) return 'Hãy chọn đơn vị phần trăm hoặc pixel.';
  const { min, max } = customLimits[unit];
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    || `Hãy nhập chiều rộng từ ${min} đến ${max}${unit === 'percent' ? '%' : ' px'}.`;
};

export const richTextImageFields: Field[] = [
  {
    name: 'imageSize',
    label: 'Kích thước ảnh',
    type: 'select',
    defaultValue: defaultSize,
    options: [
      { value: 'small', label: `Nhỏ · ${presets.small}%` },
      { value: 'medium', label: `Vừa · ${presets.medium}%` },
      { value: 'large', label: `Lớn · ${presets.large}%` },
      { value: 'full', label: `Toàn chiều rộng · ${presets.full}%` },
      { value: 'custom', label: 'Tùy chỉnh' },
    ],
    admin: { description: 'Mặc định là Vừa. Đây là kích thước dành cho trang xem bài.' },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'customWidth',
        label: 'Chiều rộng',
        type: 'number',
        admin: {
          className: 'admin-rich-text-image-width',
          condition: isCustomSize,
          width: '50%',
          description: `Chọn ${customLimits.percent.min}–${customLimits.percent.max}% hoặc ${customLimits.px.min}–${customLimits.px.max} px.`,
        },
        validate: validateCustomWidth,
      },
      {
        name: 'customWidthUnit',
        label: 'Đơn vị',
        type: 'select',
        defaultValue: 'percent',
        options: [{ value: 'percent', label: 'Phần trăm (%)' }, { value: 'px', label: 'Pixel (px)' }],
        admin: { condition: isCustomSize, width: '50%' },
      },
    ],
  },
  {
    name: 'imageAlignment',
    label: 'Căn ảnh',
    type: 'select',
    defaultValue: defaultAlignment,
    options: [{ value: 'left', label: 'Trái' }, { value: 'center', label: 'Giữa' }, { value: 'right', label: 'Phải' }],
  },
  {
    name: 'wrapText',
    label: 'Chữ bao quanh ảnh',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      condition: (_, { imageAlignment }) => imageAlignment === 'left' || imageAlignment === 'right',
      description: 'Áp dụng trên màn hình rộng khi ảnh căn trái hoặc căn phải.',
    },
  },
  {
    name: 'alt',
    label: 'Văn bản thay thế riêng',
    type: 'text',
    admin: { description: 'Mô tả ảnh cho người dùng trình đọc màn hình. Bỏ qua để dùng văn bản thay thế trong thư viện.' },
  },
  {
    name: 'caption',
    label: 'Chú thích riêng',
    type: 'text',
    admin: { description: 'Đoạn chữ bên dưới ảnh. Bỏ qua để dùng chú thích trong thư viện.' },
  },
];
