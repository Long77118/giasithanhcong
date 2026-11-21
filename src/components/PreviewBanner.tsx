import './preview.css';

export function PreviewBanner({ collection, id, status }: {
  collection: 'products' | 'posts';
  id: number;
  status: 'draft' | 'published';
}) {
  return (
    <aside className="preview-banner" aria-label="Chế độ xem trước">
      <strong>Chế độ xem trước – chưa phải bản công khai</strong>
      <span>{status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}</span>
      <a href={`/admin/collections/${collection}/${id}`}>Quay lại trang soạn</a>
    </aside>
  );
}
