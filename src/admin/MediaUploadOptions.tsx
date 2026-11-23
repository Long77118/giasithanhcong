'use client';

import { useEffect, useState } from 'react';
import { useField, useFormProcessing } from '@payloadcms/ui';
import { usePathname } from 'next/navigation';
import { defaultImageKind, formatImageBytes, imageSourceError } from '@/lib/image-upload';
import type { ImageUploadKind, ImageUploadOptions } from '@/lib/image-upload-config';
import { useImageUploadOptions } from './ImageUploadProvider';

export default function MediaUploadOptions() {
  const { value: file } = useField<File | undefined>({ path: 'file' });
  const { getOptions, setOptions } = useImageUploadOptions();
  const pathname = usePathname();
  const processing = useFormProcessing();
  // Each File keeps its own settings when switching rows in the bulk upload drawer.
  const [, refresh] = useState(0);
  const initialKind = defaultImageKind(pathname);
  const selected: ImageUploadOptions = file && getOptions(file) || { kind: initialKind, highQuality: false };
  useEffect(() => {
    if (typeof File !== 'undefined' && file instanceof File) setOptions(file, selected);
  }, [file, selected.kind, selected.highQuality, setOptions]);
  const update = (value: Partial<ImageUploadOptions>) => {
    if (!file) return;
    const next = { ...selected, ...value };
    setOptions(file, next);
    refresh((version) => version + 1);
  };
  const error = file && imageSourceError(file.size, file.type);
  return <section className="image-upload-options" aria-label="Thiết lập tối ưu ảnh">
    <strong>Tự động tối ưu trước khi tải lên</strong>
    <p>Ảnh giữ nguyên tỷ lệ. Mỗi tệp tối đa 20 MB. Công cụ chỉ xử lý ảnh bạn sắp tải lên.</p>
    {file ? <>
      <p>{file.name} · {formatImageBytes(file.size)}</p>
      <label>Vị trí sử dụng ảnh
        <select value={selected.kind} disabled={processing} onChange={(event) => update({ kind: event.target.value as ImageUploadKind })}>
          <option value="product">Sản phẩm / thư viện · tối đa 2.000 px</option>
          <option value="editorial">Banner hoặc bài viết · tối đa 1.600 px</option>
          <option value="social">Ảnh chia sẻ · tối đa 2.000 px, giữ ít nhất 1.200 px nếu ảnh gốc đủ lớn</option>
        </select>
      </label>
      <label className="image-upload-options__check"><input type="checkbox" checked={selected.highQuality} disabled={processing}
        onChange={(event) => update({ highQuality: event.target.checked })} />Giữ chất lượng cao (ảnh có chữ, logo, sơ đồ)</label>
      <p>Chất lượng cao ưu tiên PNG cho ảnh PNG/nền trong suốt, JPEG chất lượng cao cho ảnh khác. Ảnh nhỏ hơn 150 KB hoặc nén không có lợi sẽ giữ nguyên dữ liệu (có thể còn EXIF/GPS).</p>
      {error ? <p role="alert">{error}</p> : <p>Ảnh được xử lý khi bấm Lưu; kết quả dung lượng sẽ hiện trước khi gửi.</p>}
    </> : <p>Chọn tệp để chỉnh loại ảnh và chất lượng. Mặc định thư viện dùng tối đa 2.000 px, ảnh trong bài viết dùng tối đa 1.600 px.</p>}
  </section>;
}
