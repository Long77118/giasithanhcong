# Header hướng B

Header được dựng lại bằng component của repo, dùng Be Vietnam Pro và token riêng. HTML tham chiếu chỉ dùng để đối chiếu trực quan, không được đưa vào source.

Thay đổi header được chia thành sáu commit local: cài đặt số phụ, token/thành phần chung, bảng danh mục, thanh liên hệ di động, tích hợp header responsive/sticky và kiểm thử/báo cáo. Các thay đổi trang chủ có từ trước được giữ trong working tree, ngoài các commit header; snapshot schema trong working tree vẫn đi kèm cấu hình trang chủ đó.

## Cấu trúc và quyết định

- Desktop từ `80rem` (1.280 px ở cỡ chữ mặc định): tầng đầu chứa thương hiệu, tìm kiếm, liên hệ và Zalo; tầng dưới chứa danh mục và menu dạng viên thuốc. Mốc này bảo đảm thanh ghim có đủ chỗ cho ô nhập 280 px và nút báo giá. Dưới mốc này dùng header một tầng và menu di động.
- Tên bắt đầu bằng “Công Ty” được chia thành tiền tố nhỏ và phần tên đậm. Tên không có tiền tố vẫn giữ nguyên.
- Khi ghim, tầng đầu trượt khỏi màn hình theo cơ chế sticky và chiều cao thực tế. Tầng này trở thành `inert`; chỉ ô tìm kiếm của thanh ghim hoạt động. Các ô ẩn không nhận Tab và không mang `role="search"`. Hộp thoại tìm kiếm cũng chỉ có landmark khi mở.
- Danh mục có sẵn trong HTML. Chuột mở sau 150 ms, rời cả nút và bảng đóng sau 200 ms; khoảng nối giữ bảng mở khi đi xuống. Enter/Space bật tắt, Tab duyệt liên kết, Esc đóng và trả focus về nút.
- Mỗi ô có ảnh thumbnail lazy hoặc CategoryIcon, tên nhóm và tối đa ba nhóm con trực tiếp. Ô “Bán chạy” lấy sản phẩm đầu tiên thực sự được đánh dấu nổi bật trong truy vấn đã xuất bản hiện có; không dùng sản phẩm thường thay thế. Không có sản phẩm nổi bật thì ẩn ô.
- “Tin tức” dùng `/blog`. Không có route “Cách đặt hàng sỉ” trong repo, nên mục này được bỏ. Mục Sản phẩm cũng được đánh dấu khi xem danh mục; các trang chi tiết giữ mục cha đang chọn.
- Tối đa hai số hợp lệ, loại số trùng; thiếu trường nào thì ẩn trường đó. Nút Gọi dùng số hợp lệ đầu tiên. Thiếu Zalo thì nút báo giá dẫn tới `/lien-he#bao-gia`.
- Menu di động có danh mục thu gọn, menu chính và liên hệ. Thanh đáy có safe-area và khoảng đệm toàn trang; dùng thay thanh liên hệ cũ ở trang chi tiết sản phẩm để tránh chồng lấn. Không phát sinh cuộc gọi hay tin nhắn trong kiểm thử.
- Chuyển động chỉ dùng opacity/transform trong 160 ms, tắt khi giảm chuyển động. Link và nút tương tác tối thiểu 44 px. Email dài bất thường có thể rút gọn thị giác; tên đầy đủ vẫn nằm trong liên kết và thuộc tính title.

## SiteSettings và migration

Thêm `secondaryHotline` (text, tùy chọn), không đổi tên/kiểu trường cũ hay access control. Migration `20261122_080626_secondary_hotline` chỉ thêm cột nullable `site_settings.secondary_hotline`; types được sinh lại bằng Payload 3.93.0.

Trên môi trường khác, cấu hình các biến SQL dành cho migration như README rồi chạy:

```sh
npm run db:migrate
```

Sau đó nhập số thứ hai tại **Cấu hình website & Liên hệ → Số điện thoại bán sỉ thứ hai** nếu cần. Migration đã chạy trên database local. Các trường liên hệ được tạm đổi để kiểm tra trạng thái thiếu/có hai số và đã khôi phục.

## File thay đổi

| Phần | File |
| --- | --- |
| Token và bố cục | `src/app/(frontend)/header-tokens.css`, `header.css`, `layout.tsx` |
| Header | `src/components/SiteHeader.tsx`, `HeaderBrand.tsx`, `HeaderCategoryMenu.tsx`, `HeaderContactActions.tsx` |
| Di động | `src/components/MobileNav.tsx`, `MobileContactDock.tsx` |
| Dữ liệu danh mục | `src/components/ProductCategoryMenu.tsx` |
| Logic và kiểm thử | `src/lib/header.ts`, `header.test.ts`, `contact.ts`, `queries.ts` |
| Cấu hình và schema | `src/globals/SiteSettings.ts`, `src/payload-types.ts`, `src/migrations/index.ts`, `20261122_080626_secondary_hotline.ts`, `.json` |
| Báo cáo | `docs/HEADER-B.md` |

## Kiểm tra

- Lint của repo (`tsc --noEmit`), typecheck, 83 unit test và build production Node.
- Giao diện 390, 1.280 và 1.440 px; menu bàn phím, focus sau Esc, đường đi chuột từ nút xuống bảng và đóng khi rời.
- Thanh ghim: tầng đầu ra khỏi màn hình, một landmark tìm kiếm hoạt động, ô nhập thật 280 px, không có thương hiệu/điện thoại/email trong tầng ghim.
- Tìm kiếm di động giữ GET `/san-pham?q=...`; menu đánh dấu Sản phẩm sau tìm kiếm. Danh mục dùng ảnh lazy; header không có h1/h2.
- Tương phản theo các token: trắng/xanh thương hiệu 12,10:1; chữ tối/vàng 8,84:1; chữ phụ/nền 5,09:1, đều vượt 4,5:1.
- Trạng thái hai số, thiếu số phụ/email/Zalo, và thiếu toàn bộ liên hệ. Thiếu Zalo dùng đúng trang báo giá, không hiện nhãn “Chưa cấu hình”.

Build có cảnh báo webpack không lưu được cache dependency snapshot, giống các build trước; không có lỗi build. Chưa chạy bản triển khai Cloudflare hay kiểm thử Safari/iOS thực tế trong lượt này. Code runtime mới chỉ dùng React, API DOM chuẩn và CSS; không thêm thư viện hoặc API chỉ có trên Node/Workers. Safe-area và reduced-motion đã có trong CSS; thao tác thực trên thiết bị vẫn cần đối chiếu khi triển khai.
