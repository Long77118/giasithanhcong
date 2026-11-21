'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';

export default function ProductShortDescription() {
  const { value = '' } = useField<string>({ path: 'shortDescription' });
  const { initialData } = useDocumentInfo();
  const legacy = typeof initialData?.shortDescription === 'string' && initialData.shortDescription.length > 200;
  const long = value.length > 200;
  return (
    <div className="field-description" aria-live="polite">
      <p>Nên viết khoảng 150–200 ký tự: sản phẩm là gì, dùng cho ai và điểm khác biệt. Đã nhập {value.length}/200 ký tự.</p>
      {long && <p>{legacy ? 'Mô tả cũ dài hơn 200 ký tự vẫn được phép lưu. Bạn nên rút gọn và chuyển phần chi tiết sang tab Nội dung.' : 'Mô tả mới vượt 200 ký tự. Hãy rút gọn trước khi lưu.'}</p>}
    </div>
  );
}
