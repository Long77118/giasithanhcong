'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';
import { PRODUCT_DESCRIPTION_MAX, PRODUCT_DESCRIPTION_MIN } from '@/lib/editor-completeness';

export default function ProductShortDescription() {
  const { value } = useField<string>({ path: 'shortDescription' });
  const { initialData } = useDocumentInfo();
  const legacy = typeof initialData?.shortDescription === 'string' && initialData.shortDescription.length > PRODUCT_DESCRIPTION_MAX;
  const length = value?.length ?? 0;
  const long = length > PRODUCT_DESCRIPTION_MAX;
  return (
    <div className="field-description admin-editor-description" aria-live="polite">
      <p>Nên viết {PRODUCT_DESCRIPTION_MIN}–{PRODUCT_DESCRIPTION_MAX} ký tự về công dụng và điểm khác biệt của sản phẩm.</p>
      <span className="admin-editor-row-pill" data-kind={long ? 'warning' : value && value.trim().length >= PRODUCT_DESCRIPTION_MIN ? 'done' : 'muted'}>{length}/{PRODUCT_DESCRIPTION_MAX} ký tự</span>
      {long && <p>{legacy ? 'Mô tả cũ dài hơn 200 ký tự vẫn được phép lưu. Bạn nên rút gọn và chuyển phần chi tiết sang tab Nội dung.' : 'Mô tả mới vượt 200 ký tự. Hãy rút gọn trước khi lưu.'}</p>}
    </div>
  );
}
