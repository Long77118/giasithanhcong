# Thiết kế giao diện quản trị

Giai đoạn 0 chốt hướng thiết kế và các điểm mở rộng cho `/admin`. Đối chiếu mã đang cài của Next.js `16.4.6`, Payload `3.93.0`, `@payloadcms/ui`, `@payloadcms/next` và `@payloadcms/translations` cùng phiên bản `3.93.0`.

## Hướng thiết kế

Chủ shop và nhân viên bán hàng cần thấy việc cần xử lý trước, sau đó mở danh sách hoặc chỉnh nội dung với ít thao tác. Trên desktop, Tổng quan dùng một khối báo giá nổi bật cạnh các chỉ số, rồi tới danh sách gần đây và thao tác tạo nhanh. Các thống kê, nhãn hàng và tiêu đề căn trái để người dùng quét theo cột. Trên điện thoại, thứ tự đọc giữ nguyên khi xếp thành một cột.

Mảng màu mạnh và đường viền kiểu nhãn dán xuất hiện ở khung ngoài, Đăng nhập và Tổng quan. Đăng nhập có một minh họa SVG tự vẽ gồm hộp kraft, ly và túi giấy. Trạng thái trống có thể dùng một phiên bản nhỏ của chiếc hộp mở. SVG trang trí dùng `aria-hidden` khi chữ bên cạnh đã giải thích nội dung. Dùng Lucide cho biểu tượng chức năng và gắn nhãn tiếng Việt cho nút chỉ có biểu tượng. Nền bảng và vùng nhập liệu ít màu, ưu tiên đường phân cách, chữ và chỉ báo trạng thái.

## Khảo sát mã hiện tại

| Khu vực | Hiện trạng |
| --- | --- |
| Layout và màu | `src/app/(payload)/layout.tsx` nạp CSS Payload rồi đến `custom.scss`. Bộ biến `--workspace-*` xanh lá cấp màu cho trang quản trị. Payload đặt `data-theme` trên `html` và quản lý lựa chọn sáng, tối hoặc theo hệ thống. Style ở layout Payload được tải theo nhóm route quản trị. |
| Nhận diện và điều hướng | `Brand.tsx` lấy tên thương hiệu từ cấu hình hiện tại và dùng `mark.png` cho logo. `OverviewLink.tsx` đặt `aria-current` dựa trên đường dẫn. Menu gốc Payload dùng các nhóm Danh mục hàng, Nội dung, Kinh doanh và Hệ thống. |
| Đăng nhập | `beforeLogin` và `afterLogin` bổ sung tiêu đề, ảnh `packaging-studio.webp` và liên kết về website quanh form gốc. `custom.scss` dùng lưới hai cột trên desktop và xếp dọc ở màn hình nhỏ. Tài sản xây mới cho đợt này là SVG gốc. |
| Tổng quan | `Dashboard.tsx` kiểm tra Admin, chạy bốn truy vấn đếm và lấy tối đa năm báo giá gần đây với `depth: 0`, `select` hẹp và `overrideAccess: false`. Báo giá mới dùng liên kết lọc trạng thái và nhãn có chữ. |
| Biểu mẫu | `Products.ts` có tab nhập liệu, bộ đếm mô tả ngắn và nhãn hàng ảnh/thông số. `ProductRowLabels.tsx` có thể gọi REST lấy tên file riêng từng hàng nếu ảnh chỉ có ID và thiếu chú thích. `HomePromotionLabel.tsx` đọc tiêu đề và trạng thái từ hàng banner. `Posts.ts` dùng Lexical và plugin SEO. `SiteSettings.ts` quản lý banner, kệ sản phẩm, địa chỉ và SEO mặc định. |
| Ảnh và PDF | `MediaUploadOptions.tsx` dùng `useField`, `useFormProcessing` và tùy chọn theo từng `File`. `ImageUploadProvider.tsx` bọc luồng `fetch` để chuẩn bị ảnh và hiển thị tiến độ. `image-upload.css` dùng class riêng cùng các biến Payload. Documents có luồng tải PDF riêng. |
| Báo giá | `QuoteRequests.ts` chỉ cho Admin thao tác qua collection. Dữ liệu sẵn có gồm khách hàng, điện thoại, email, công ty, sản phẩm, nội dung, số lượng, nguồn, thời gian và trạng thái. Chưa có trường ghi chú nội bộ. |

## Điểm tùy biến đã xác minh trong Payload 3.93

| Nhu cầu | Điểm mở rộng |
| --- | --- |
| Màu, chữ và hình khối | Đặt biến trong stylesheet của layout Payload. `@payloadcms/ui/dist/scss/app.scss` khai báo `--theme-bg`, `--theme-input-bg`, `--theme-text`, `--theme-overlay`, `--font-body`, `--style-radius-s`, `--style-radius-m`, `--style-radius-l`, `--gutter-h`, `--accessibility-outline` và `--accessibility-outline-offset`. `colors.scss` có các dải `--theme-elevation-*`, `--theme-success-*`, `--theme-warning-*` và `--theme-error-*`. Đối chiếu màu tiêu thụ theo từng component trước khi ánh xạ cả dải. |
| Nhận diện, đăng nhập và menu | Dùng `admin.components.graphics.Icon/Logo`, `beforeLogin`, `afterLogin`, `beforeNavLinks` và `afterNavLinks`. Dùng `admin.group` của collections/globals để phân nhóm và giữ menu gốc xử lý trạng thái mở/thu gọn. `admin.components.Nav` có thể thay toàn bộ menu nhưng cần kiểm chứng lại điều hướng, focus và thu gọn. Chip theo từng link chưa có điểm gắn riêng trong các slot đang dùng. |
| Tổng quan và dữ liệu | `admin.components.views.dashboard.Component` nhận `AdminViewServerProps` với `initPageResult.req`. Dùng cùng request, `overrideAccess: false`, `count`/`find` hữu hạn và `select` hẹp. |
| Danh sách, ô và biểu mẫu | Dùng `admin.defaultColumns`, `admin.components.beforeList/afterList` cho danh sách. Field hỗ trợ `admin.components.Cell`, `Field`, `Description` và array hỗ trợ `RowLabel`. Dùng `useField`, `useRowLabel` và `useDocumentInfo` cho thành phần client cần trạng thái biểu mẫu. Giữ control gốc cho các trường nhập và dùng admin.components.edit.beforeDocumentControls cho vùng hỗ trợ phù hợp. |
| Upload và trạng thái | `admin.components.providers` tiếp tục cung cấp ngữ cảnh upload. CSS của các component riêng dùng class `image-upload-*`. Badge tùy biến dùng `Cell`. Kiểm tra màu mặc định của toast, dialog, date picker, upload drawer và Lexical trước khi cân nhắc selector nội bộ. |
| Theme, font và bản dịch | Payload quyết định theme qua cấu hình mặc định, cookie và chế độ theo hệ thống. `RootLayout.htmlProps` của `@payloadcms/next` nhận class cho thẻ `html`. `i18n.supportedLanguages` và `i18n.fallbackLanguage` đang dùng `vi`. Ở giai đoạn câu chữ, truyền khóa cần ghi đè qua `i18n.translations.vi` theo `@payloadcms/translations/dist/types.d.ts` và tệp `languages/vi.js`. Các khóa như `general.save`, `general.delete` và `general.noResults` cần giữ biến nội suy của gói. |

Nguồn xác minh bổ sung trong bản cài gồm `payload/dist/config/types.d.ts`, `payload/dist/fields/config/types.d.ts`, `payload/dist/collections/config/types.d.ts`, `@payloadcms/next/dist/layouts/Root/index.d.ts` và `@payloadcms/ui/dist/providers/Theme`. Import map tiếp tục do Payload tạo qua `npm run payload:importmap` khi thêm hoặc đổi đường dẫn component.

## Bảng màu đề xuất

| Vai trò | Sáng | Tối |
| --- | --- | --- |
| Nền ngoài | `#FFF9F0` | `#18132B` |
| Bảng và ô nhập | `#FFFFFF` | `#241C38` |
| Thanh bên | `#FFFCF7` | `#211A33` |
| Chữ chính | `#1F1A3D` | `#F7F1FF` |
| Chữ phụ và gợi ý nhập | `#574D70` | `#C8BCDB` |
| Viền nhận diện ô nhập | `#8C7FA2` | `#7E7198` |
| Nền hàng được chọn | `#EDE5F8` | `#382B55` |
| Focus | `#5939C6` | `#C7ACFF` |
| Nút chính, nền / chữ | `#5736C9` / `#FFFFFF` | `#BAA7FF` / `#1F1A3D` |
| Nút chính khi rê chuột | `#4526A7` | `#D1C2FF` |
| Tím thương hiệu cho minh họa và điểm nhấn | `#7C5CFF` | `#7C5CFF` |
| Lỗi, nền / chữ | `#FFF0EB` / `#9A3328` | `#452632` / `#FF9C8F` |
| Cảnh báo, nền / chữ | `#FFF5CC` / `#735205` | `#46341F` / `#FFD978` |
| Thông tin, nền / chữ | `#F0E9FF` / `#5533C4` | `#342851` / `#C8B5FF` |
| Thành công, nền / chữ | `#E1FAF0` / `#12664F` | `#1C3B38` / `#75E8C0` |

| Giá trị lưu | Nhãn dự kiến | Nền cả hai chế độ | Chữ và biểu tượng | Lucide |
| --- | --- | --- | --- | --- |
| `new` | Mới | San hô `#FF6B57` | `#1F1A3D` | `Inbox` |
| `contacted` | Đã liên hệ | Vàng nắng `#FFC93C` | `#1F1A3D` | `PhoneCall` |
| `quoted` | Đã gửi báo giá | Tím oải hương nhạt `#BAA7FF` | `#1F1A3D` | `Send` |
| `closed` | Hoàn tất | Bạc hà `#2FD6A5` | `#1F1A3D` | `CircleCheck` |

Tím thương hiệu `#7C5CFF` chỉ đạt 4,35:1 với chữ trắng và 3,79:1 với chữ tím than. Nút sáng dùng tím đậm `#5736C9` để đạt 7,56:1 với chữ trắng. Chip tím chọn sắc oải hương nhạt để chữ tím than đạt 7,90:1. Duy trì nhãn chữ trên mọi chip, trạng thái chọn có dấu hiệu hình học hoặc văn bản bên cạnh màu.

### Tương phản đã tính

Đo trên mã sRGB đặc, với ngưỡng 4,5:1 cho chữ thường và 3:1 cho chữ lớn, viền và biểu tượng chức năng. So với ngưỡng bằng số chưa làm tròn. Đây là kết quả của bảng màu đề xuất. Từng trạng thái trong trình duyệt sẽ được đối chiếu lại khi triển khai theme. [WCAG 2.2, tương phản chữ](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [WCAG 2.2, tương phản đồ họa](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

| Chế độ | Vai trò | Tiền cảnh | Nền | Ngưỡng | Tỷ lệ | Kết quả |
| --- | --- | --- | --- | ---: | ---: | --- |
| Sáng | Chữ chính / nền ngoài | `#1F1A3D` | `#FFF9F0` | 4,5 | 15,75 | Đạt |
| Sáng | Chữ chính / bảng và form | `#1F1A3D` | `#FFFFFF` | 4,5 | 16,49 | Đạt |
| Sáng | Chữ menu / nền thanh bên | `#1F1A3D` | `#FFFCF7` | 4,5 | 16,11 | Đạt |
| Sáng | Chữ phụ / nền ngoài | `#574D70` | `#FFF9F0` | 4,5 | 7,43 | Đạt |
| Sáng | Chữ phụ / bảng và form | `#574D70` | `#FFFFFF` | 4,5 | 7,78 | Đạt |
| Sáng | Chữ menu phụ / nền thanh bên | `#574D70` | `#FFFCF7` | 4,5 | 7,60 | Đạt |
| Sáng | Chữ vùng chọn / nền tím nhẹ | `#1F1A3D` | `#EDE5F8` | 4,5 | 13,48 | Đạt |
| Sáng | Viền nhận diện ô nhập / nền ô | `#8C7FA2` | `#FFFFFF` | 3 | 3,70 | Đạt |
| Sáng | Viền nhận diện ô nhập / nền ngoài | `#8C7FA2` | `#FFF9F0` | 3 | 3,54 | Đạt |
| Sáng | Focus / nền ô | `#5939C6` | `#FFFFFF` | 3 | 7,43 | Đạt |
| Sáng | Focus / nền ngoài | `#5939C6` | `#FFF9F0` | 3 | 7,10 | Đạt |
| Sáng | Focus / nền thanh bên | `#5939C6` | `#FFFCF7` | 3 | 7,26 | Đạt |
| Sáng | Nút chính | `#FFFFFF` | `#5736C9` | 4,5 | 7,56 | Đạt |
| Sáng | Nút chính khi rê chuột | `#FFFFFF` | `#4526A7` | 4,5 | 10,06 | Đạt |
| Sáng | Chữ và biểu tượng chip Mới | `#1F1A3D` | `#FF6B57` | 4,5 | 5,88 | Đạt |
| Sáng | Chữ và biểu tượng chip Đã liên hệ | `#1F1A3D` | `#FFC93C` | 4,5 | 10,74 | Đạt |
| Sáng | Chữ và biểu tượng chip Đã gửi báo giá | `#1F1A3D` | `#BAA7FF` | 4,5 | 7,90 | Đạt |
| Sáng | Chữ và biểu tượng chip Hoàn tất | `#1F1A3D` | `#2FD6A5` | 4,5 | 8,86 | Đạt |
| Sáng | Lỗi / nền lỗi | `#9A3328` | `#FFF0EB` | 4,5 | 6,57 | Đạt |
| Sáng | Cảnh báo / nền cảnh báo | `#735205` | `#FFF5CC` | 4,5 | 6,53 | Đạt |
| Sáng | Thông tin / nền thông tin | `#5533C4` | `#F0E9FF` | 4,5 | 6,70 | Đạt |
| Sáng | Thành công / nền thành công | `#12664F` | `#E1FAF0` | 4,5 | 6,30 | Đạt |
| Sáng | San hô đậm / nền ngoài | `#9A3328` | `#FFF9F0` | 4,5 | 6,97 | Đạt |
| Sáng | Vàng đậm / nền ngoài | `#735205` | `#FFF9F0` | 4,5 | 6,83 | Đạt |
| Sáng | Tím đậm / nền ngoài | `#5533C4` | `#FFF9F0` | 4,5 | 7,55 | Đạt |
| Sáng | Bạc hà đậm / nền ngoài | `#12664F` | `#FFF9F0` | 4,5 | 6,60 | Đạt |
| Tối | Chữ chính / nền ngoài | `#F7F1FF` | `#18132B` | 4,5 | 16,27 | Đạt |
| Tối | Chữ chính / bảng và form | `#F7F1FF` | `#241C38` | 4,5 | 14,62 | Đạt |
| Tối | Chữ menu / nền thanh bên | `#F7F1FF` | `#211A33` | 4,5 | 15,06 | Đạt |
| Tối | Chữ phụ / nền ngoài | `#C8BCDB` | `#18132B` | 4,5 | 10,00 | Đạt |
| Tối | Chữ phụ / bảng và form | `#C8BCDB` | `#241C38` | 4,5 | 8,99 | Đạt |
| Tối | Chữ menu phụ / nền thanh bên | `#C8BCDB` | `#211A33` | 4,5 | 9,26 | Đạt |
| Tối | Chữ vùng chọn / nền tím nhẹ | `#F7F1FF` | `#382B55` | 4,5 | 11,54 | Đạt |
| Tối | Viền nhận diện ô nhập / nền ô | `#7E7198` | `#241C38` | 3 | 3,62 | Đạt |
| Tối | Viền nhận diện ô nhập / nền ngoài | `#7E7198` | `#18132B` | 3 | 4,03 | Đạt |
| Tối | Focus / nền ô | `#C7ACFF` | `#241C38` | 3 | 8,30 | Đạt |
| Tối | Focus / nền ngoài | `#C7ACFF` | `#18132B` | 3 | 9,23 | Đạt |
| Tối | Focus / nền thanh bên | `#C7ACFF` | `#211A33` | 3 | 8,55 | Đạt |
| Tối | Nút chính | `#1F1A3D` | `#BAA7FF` | 4,5 | 7,90 | Đạt |
| Tối | Nút chính khi rê chuột | `#1F1A3D` | `#D1C2FF` | 4,5 | 10,11 | Đạt |
| Tối | Chữ và biểu tượng chip Mới | `#1F1A3D` | `#FF6B57` | 4,5 | 5,88 | Đạt |
| Tối | Chữ và biểu tượng chip Đã liên hệ | `#1F1A3D` | `#FFC93C` | 4,5 | 10,74 | Đạt |
| Tối | Chữ và biểu tượng chip Đã gửi báo giá | `#1F1A3D` | `#BAA7FF` | 4,5 | 7,90 | Đạt |
| Tối | Chữ và biểu tượng chip Hoàn tất | `#1F1A3D` | `#2FD6A5` | 4,5 | 8,86 | Đạt |
| Tối | Lỗi / nền lỗi | `#FF9C8F` | `#452632` | 4,5 | 6,60 | Đạt |
| Tối | Cảnh báo / nền cảnh báo | `#FFD978` | `#46341F` | 4,5 | 8,72 | Đạt |
| Tối | Thông tin / nền thông tin | `#C8B5FF` | `#342851` | 4,5 | 7,34 | Đạt |
| Tối | Thành công / nền thành công | `#75E8C0` | `#1C3B38` | 4,5 | 8,12 | Đạt |
| Tối | San hô đậm / nền ngoài | `#FF9C8F` | `#18132B` | 4,5 | 8,92 | Đạt |
| Tối | Vàng đậm / nền ngoài | `#FFD978` | `#18132B` | 4,5 | 13,24 | Đạt |
| Tối | Tím đậm / nền ngoài | `#C8B5FF` | `#18132B` | 4,5 | 9,86 | Đạt |
| Tối | Bạc hà đậm / nền ngoài | `#75E8C0` | `#18132B` | 4,5 | 12,05 | Đạt |
| Đối chiếu | Chữ trắng / tím gốc | `#FFFFFF` | `#7C5CFF` | 4,5 | 4,35 | Không dùng |
| Đối chiếu | Chữ tím than / tím gốc | `#1F1A3D` | `#7C5CFF` | 4,5 | 3,79 | Không dùng |

Để tính lại, sao chép đoạn dưới vào một file `.cjs` và chạy bằng Node từ thư mục repo. Script đọc bảng trên và cũng kiểm tra các giá trị đối chiếu bị loại.

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const rows = fs.readFileSync('docs/ADMIN-UI.md', 'utf8').matchAll(
  /^\| (Sáng|Tối|Đối chiếu) \| ([^|]+) \| `(#[0-9A-F]{6})` \| `(#[0-9A-F]{6})` \| (3|4,5) \| (\d+,\d{2}) \| (Đạt|Không dùng) \|$/gm,
);
const luminance = (hex) => {
  const [red, green, blue] = hex.slice(1).match(/../g).map((channel) => {
    const srgb = Number.parseInt(channel, 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};
let count = 0;
for (const [, mode, label, foreground, background, minimum, expected, status] of rows) {
  const a = luminance(foreground);
  const b = luminance(background);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const display = ratio.toFixed(2).replace('.', ',');
  const passed = ratio >= Number(minimum.replace(',', '.'));
  assert.equal(display, expected, label);
  assert.equal(passed, status === 'Đạt', label);
  if (mode !== 'Đối chiếu') assert.ok(passed, label);
  console.log(mode, label.trim(), display, status);
  count++;
}
assert.ok(count > 0, 'Không tìm thấy bảng tương phản.');
```

## Chữ, khoảng cách, hình khối và chuyển động

| Hạng mục | Quy ước |
| --- | --- |
| Font | Ưu tiên Be Vietnam Pro cho toàn admin, tái sử dụng họ font đang có với tập ký tự `latin` và `vietnamese`. Bắt đầu với 400, 600, 700 và fallback `Segoe UI`, `system-ui`. Kiểm chứng đường gắn biến qua `RootLayout.htmlProps` vì file layout hiện được Payload đánh dấu là có thể sinh lại. Nếu bước tích hợp làm thay đổi layout chung hoặc tải thêm họ font, giữ fallback cho đến khi có cách gắn riêng ổn định. |
| Cỡ chữ | Nhãn và dữ liệu bảng 14–15 px với line-height 1,45–1,55. Chữ phụ 13 px với line-height 1,5. Tiêu đề section 20–24 px, tiêu đề trang 28–36 px. Số đếm bật chữ số đều chiều rộng. Thử tên dài, dấu chồng và ngắt dòng ở tổng quan, ô chọn và nút. |
| Khoảng cách | Dùng nấc 4, 8, 12, 16, 24, 32, 48 px. Form ưu tiên khoảng 16 px giữa các trường. Bảng giữ chiều cao hàng khoảng 44–48 px trên desktop. Hành động chính trên điện thoại có vùng bấm tối thiểu 44 px và nhóm nút có thể xuống dòng. |
| Bo góc | Mốc 8 px cho ô nhập nhỏ và nút phụ, 12 px cho nút chính, 16 px cho bảng và thẻ công việc, 20–24 px cho khối Đăng nhập và Tổng quan. Dùng dạng pill cho chip trạng thái và chip biểu tượng. |
| Viền và bóng | Viền chức năng 1 px theo bảng màu. Thẻ minh họa hoặc nút chính có thể dùng viền 2 px và bóng lệch `0 3px 0` cùng sắc đậm. Bảng chỉ dùng viền và phân cách hàng. Overlay dùng bóng mềm `0 12px 28px #1F1A3D26` ở sáng hoặc `0 12px 28px #0C081AB3` ở tối. |
| Focus | Vòng `:focus-visible` tối thiểu 2 px và cách 3 px. Kiểm tra toàn bộ vòng với màu nền kề, đặc biệt trong bảng cuộn và drawer. Các nút chỉ có biểu tượng cần tooltip hoặc nhãn truy cập phù hợp. |
| Chuyển động | Hover và focus khoảng 120–160 ms. Mở khối Tổng quan hoặc xác nhận trạng thái khoảng 180–220 ms. Chỉ cân nhắc hiệu ứng ăn mừng một lần khi vừa đạt 100%. `prefers-reduced-motion: reduce` bỏ dịch chuyển và keyframe trang trí, giữ phản hồi tức thì bằng chữ, màu và focus. |

## Giọng văn

Dùng “bạn” khi hướng dẫn, dòng ngắn và động từ rõ. Giữ cùng một từ cho cùng hành động xuyên suốt nút, hộp thoại và thông báo. Ưu tiên “Lưu”, “Xuất bản”, “Sao chép số” hoặc “Xem yêu cầu mới”. Trạng thái trống gợi bước có ích, ví dụ “Chưa có yêu cầu báo giá. Yêu cầu mới sẽ xuất hiện ở đây.” Thông báo thành công cho biết việc vừa hoàn tất, ví dụ “Đã lưu sản phẩm.” Thông báo lỗi mô tả điều kiện và cách xử lý, ví dụ “Mô tả ngắn vượt 200 ký tự. Hãy rút gọn rồi lưu lại.” Tiết chế câu đùa ở trạng thái trống và thông báo vui. Nhãn trường, bảng và dữ liệu dùng chữ thuần.

## Selector nội bộ đang được ghi đè

Kiểm kê từ `src/app/(payload)/custom.scss` và chỉ ra chỗ trộn selector có sẵn. Class `workspace-*` và `image-upload-*` do dự án sở hữu. Gom phần ghi đè Payload còn cần vào một stylesheet tương thích, kèm lý do và ca kiểm thử cạnh từng nhóm. Biến CSS và component slot là lựa chọn đầu tiên.

| Khu vực | Selector hoặc hook kiểu hiện có | Kiểm tra khi đổi theme hoặc nâng Payload |
| --- | --- | --- |
| Menu, liên kết | `.nav`, `.nav .nav__link`, `.nav .nav__link:is(:hover, .active, :has(.nav__link-indicator))`, `.nav .nav__link-indicator`, `.nav .nav-group`, `.nav .nav-group__toggle`, `.nav .nav__header` | Rà dấu trang đang mở, trạng thái thu gọn, thứ tự Tab và chiều rộng menu ở 390 px. Indicator hiện bị ẩn bằng CSS nên phải còn dấu hiệu nhận biết mục đang mở. |
| Nút phát triển | `html:has(nextjs-portal) .nav__controls` | Kiểm tra nút thu gọn với chỉ báo Next.js khi chạy dev. `nextjs-portal` là DOM nội bộ của Next.js. |
| Thanh trên và breadcrumb | `.app-header`, `.app-header .workspace-mark`, `.app-header :is(.app-header__step-nav-wrapper, .app-header__step-nav, .step-nav__last)`, `.app-header .app-header__step-nav-wrapper`, `.app-header .app-header__step-nav` | Rà logo và breadcrumb có tên tài liệu dài ở màn hình nhỏ. |
| Nút và tiêu đề | `.btn`, `.btn--style-primary:not(.btn--disabled):not(:disabled)`, `.collection-list .list-header`, `.list-header .list-create-new-doc__create-new-button`, `.list-header__title`, `.doc-header__title` | Kiểm tra hover, focus, disabled, Lưu, Tạo mới và giảm chuyển động. `--bg-color`, `--hover-bg`, `--color`, `--hover-color` đang được đặt trên class nút nội bộ. |
| Bảng và role | `.collection-list__tables .table`, `.collection-list__tables .table table th`, `.collection-list__tables .table table :is(th, td)`, `.collection-list__tables .table table td`, `.collection-list__tables .table table tbody tr:hover td`, `.cell-role .selected--admin` | Rà cuộn ngang, ô chọn, sắp xếp, cột mặc định và chip quyền. Ưu tiên `Cell` cho các chip trạng thái mới. |
| Form và vùng auth | `.collection-edit .collection-edit__auth`, `.field-type :is(input:not([type='checkbox'], [type='radio'], [type='range']), textarea, .rs__control)`, `.search-filter input`, `.field-type :is(input, textarea):focus`, `.field-type .rs__control--is-focused`, `.field-label`, `.doc-controls .doc-controls__meta` | Rà ô lỗi, trạng thái vô hiệu hóa, hiển thị nút Lưu và focus trong dropdown. `ProductShortDescription.tsx` cũng dùng class `.field-description` để kế thừa kiểu mô tả của Payload. |
| Đăng nhập và route tối giản | `.template-minimal:not(.login) .template-minimal__wrap`, `.login.template-minimal`, `.login .template-minimal__wrap`, `.login .login__brand`, `.login .login__form__inputWrap`, `.login form input:not([type='checkbox'])`, `.login form .btn--style-primary` và `.login form .btn--style-primary .btn__content` | Đây là vùng có phụ thuộc DOM lớn nhất. Rà Đăng nhập, Quên/Đặt lại mật khẩu, Tạo Admin đầu tiên, form lỗi và bố cục một cột. |

## Kế hoạch và điểm cần xác minh

Giai đoạn 1 tập trung biến màu và ánh xạ Payload trong `_tokens.scss`, phần trình bày của component riêng trong `_workspace.scss`, và selector nội bộ trong `_payload-compat.scss` tại `src/admin/styles/`. Layout Payload gắn Be Vietnam Pro qua `RootLayout.htmlProps`, với ba mức 400, 600, 700 và tập ký tự tiếng Việt. Kiểm tra lại dòng gắn font nếu cần sinh lại layout khi nâng Payload.

Các selector cần rà thêm ở lần nâng cấp gồm `.checkbox-input__input`, `.checkbox-input--checked .checkbox-input__icon`, `.tabs-field__tab-button`, `.tabs-field__tab-button--active`, `.confirmation-modal__wrapper` và các lớp toast trong `.payload-toast-container`. Kiểm tra `.drawer__content` và `.drawer__blur-bg` ở chế độ giảm chuyển động. Các quy tắc này nằm chung trong `_payload-compat.scss`.

Kiểm tra Giai đoạn 1 trên Chromium với bản build Node ghi nhận nút đăng nhập đạt 7,56:1 ở chế độ sáng và 7,90:1 ở chế độ tối. Đã mở danh sách, tab, trường ngày, Lexical, drawer chọn ảnh và hộp thoại xác nhận trong hai chế độ. Toast lỗi slug có chuỗi hệ thống tiếng Anh và sẽ được rà trong Giai đoạn 5. Kiểm tra trên Workers và ma trận trợ năng đầy đủ thuộc Giai đoạn 6.

Trong Giai đoạn 2, bốn nhóm menu dùng `admin.group` và nút thu gọn của Payload. Chip trang trí trong menu theo các ID `#nav-quote-requests`, `#nav-products`, `#nav-product-categories`, `#nav-posts`, `#nav-post-categories`, `#nav-media`, `#nav-documents`, `#nav-users` và `#nav-global-site-settings`. Kiểm tra các ID và chip sau khi nâng Payload. Trang Đăng nhập dùng giờ thiết bị sau khi trang tương tác được, với các mốc 11:00, 14:00 và 18:00. Form và liên kết quay về website nằm ở các điểm gắn hiện có.

Trang Việc hôm nay dùng sáu phép đếm tại cơ sở dữ liệu và lấy tối đa năm yêu cầu gần nhất. Mọi truy vấn tùy biến đi qua request Payload hiện tại với `overrideAccess: false`. Số đếm và URL danh sách dùng cùng bộ lọc.

| Chỉ số | Điều kiện |
| --- | --- |
| Báo giá mới | Trạng thái `new`. |
| Chờ quá 24 giờ | Trạng thái `new` và thời điểm tạo trước mốc 24 giờ. |
| Sản phẩm hoặc bài viết đang nháp | Trạng thái `draft` trên từng danh sách tương ứng. |
| Sản phẩm thiếu ảnh | Bộ ảnh trống hoặc có dòng không còn liên kết tới ảnh. |
| Sản phẩm thiếu mô tả SEO | Trường mô tả trong tab SEO chưa có dữ liệu hoặc là chuỗi rỗng. Mô tả tự sinh từ nội dung sản phẩm không được tính là mô tả đã điền. |

Giai đoạn 3 dùng cell chính thức của Payload cho tên khách, sản phẩm, trạng thái, thời gian và thao tác nhanh. Bộ lọc nhanh thay các điều kiện cột hiện tại, giữ từ khóa tìm kiếm và đưa danh sách về trang đầu. “Chờ lâu” dùng cùng mốc 24 giờ với Tổng quan. Thời gian tuyệt đối của yêu cầu được hiển thị theo giờ Việt Nam. Sau khi nâng Payload, kiểm tra lại kích thước cột và checkbox chọn hàng ở selector `.collection-list__tables .table:has(.admin-quote-actions)`.

Chuyển trạng thái nhanh đi theo từng bước và gửi trạng thái đang thấy lên endpoint của collection. Endpoint yêu cầu Admin, khóa bản ghi PostgreSQL trong giao dịch và đối chiếu trạng thái trước khi ghi qua Payload với `overrideAccess: false`. Khi một cửa sổ khác đã cập nhật, danh sách được tải lại và người dùng nhận thông báo. Bảng và form dùng các thành phần trình bày. Phần ghi chú nội bộ đã được bỏ khỏi phạm vi theo xác nhận của chủ dự án.

### Checklist biên tập ở Giai đoạn 4

Thanh bên đọc dữ liệu đang nhập từ Payload. Điểm là tỷ lệ mục đạt, làm tròn xuống và chỉ lên 100% khi mọi mục đạt. Checklist là gợi ý biên tập. Các quy tắc lưu và xuất bản vẫn do biểu mẫu hiện có quyết định.

| Phạm vi | Điều kiện đánh dấu hoàn thành |
| --- | --- |
| Sản phẩm | Có tên và SKU, danh mục, mô tả ngắn từ 150–200 ký tự theo hướng dẫn đang có, ảnh ở dòng đầu tiên, Alt SEO trên mỗi ảnh đã chọn, ít nhất một cặp tên và giá trị thông số, và quy cách đóng gói. |
| Bài viết | Có tiêu đề, tóm tắt, chuyên mục, ảnh đại diện, Alt SEO trên ảnh đại diện và văn bản thật trong Lexical. Số từ dùng chung cách đếm với thời gian đọc. Dự án chưa có yêu cầu về số từ tối thiểu, nên một nội dung có văn bản đã đạt mục này. |
| SEO trên cả hai form | Tiêu đề 50–60 ký tự và mô tả 100–150 ký tự theo chỉ báo của `@payloadcms/plugin-seo` 3.93.0. Khoảng trắng ở hai đầu được bỏ trước khi đếm. Điểm dùng giá trị đang có trong tab SEO vì đây là phần người biên tập có thể kiểm tra. |

Ảnh có dữ liệu alt đi kèm được đọc trực tiếp. Khi trường trả ID, checklist gộp các ID trùng và đọc Alt SEO theo lô tối đa 40 ảnh qua API Media. Nếu API lỗi, mục alt báo “Chưa kiểm tra được ảnh”. Các mục thiếu chỉ ra tên tab hoặc Thư viện ảnh vì Payload 3.93 chưa cung cấp API công khai để chuyển tab và lấy nét trường đang ẩn. Hiệu ứng ở 100% chỉ chạy một lần trong phiên mở form, khi điểm chuyển từ dưới 100% lên 100%, và được bỏ theo thiết lập giảm chuyển động. Sau khi nâng Payload, rà format trường upload, danh sách hàng, và các khoảng SEO mặc định.

### Câu chữ tiếng Việt ở Giai đoạn 5

Các phần ghi đè dùng `i18n.translations.vi` trên bản dịch Payload hiện có. Chuỗi giữ nguyên biến nội suy và thẻ định dạng của Payload. Nhãn SEO lấy từ cấu hình trường, còn chỉ báo ký tự và xem trước dùng bộ khóa `plugin-seo`. Sản phẩm, bài viết và hai nhóm danh mục dùng chung cách gọi trạng thái xuất bản. Yêu cầu báo giá dùng chung nhãn trạng thái giữa Tổng quan, bộ lọc, bảng và form.

| Khu vực | Trước | Sau |
| --- | --- | --- |
| Đăng nhập | Đăng nhập bằng email quản trị để bắt đầu. | Dùng email quản trị của bạn để đăng nhập. |
| Sai thông tin đăng nhập | Lỗi - Email hoặc mật khẩu không chính xác. | Email hoặc mật khẩu chưa đúng. Hãy kiểm tra rồi thử lại. |
| Quên mật khẩu | Nhập email của bạn để nhận hướng dẫn tạo lại mật khẩu. | Nhập email bạn dùng để đăng nhập. Hướng dẫn đặt lại mật khẩu sẽ được gửi đến email đó. |
| Đặt lại mật khẩu | Tạo lại mật khẩu | Đặt lại mật khẩu |
| Tạo Admin đầu tiên | Để bắt đầu, hãy tạo người dùng đầu tiên. | Tạo tài khoản quản trị đầu tiên để bắt đầu. |
| Điều hướng | Collections / Bảng điều khiển / Cấu hình chung (globals) | Danh sách nội dung / Tổng quan / Cấu hình chung |
| Tùy chọn tài khoản | Giao diện bảng điều khiển / Vietnamese (Tiếng Việt) | Chế độ màu / Tiếng Việt |
| Danh sách trống | Không có kết quả. | Chưa có kết quả. Phần hướng dẫn gợi ý đổi từ khóa, xóa bộ lọc hoặc tạo mục mới. |
| Tiêu đề tạo nội dung | Đang tạo mới `{{label}}` | Tạo `{{label}}` |
| Thông báo tạo và lưu | `{{label}}` đã được tạo thành công. / Cập nhật thành công. | Đã tạo `{{label}}`. / Đã lưu thay đổi. |
| Thông báo khi rời form | Thay đổi chưa được lưu lại. Bạn sẽ mất bản chỉnh sửa nếu thoát bây giờ. | Bạn sẽ mất các thay đổi chưa lưu nếu rời trang này. |
| Hộp thoại xóa hàng loạt | Bạn sắp xóa `{{count}} {{label}}` | Bạn có muốn xóa `{{count}} {{label}}` đã chọn không? |
| Lỗi dữ liệu | Lỗi - Xin hãy sửa lại những fields không hợp lệ. | Bạn kiểm tra các ô được đánh dấu rồi lưu lại nhé. |
| Ô bắt buộc | Trường này là bắt buộc. | Hãy điền thông tin này. |
| Lưu đường dẫn hoặc danh mục cha không hợp lệ | Tiêu đề tiếng Anh có `slug` hoặc `parent`. | Bạn cần kiểm tra ô Đường dẫn (slug) hoặc Danh mục cha. Lỗi dưới ô cho biết cách sửa. |
| Trạng thái xuất bản | Bản nháp (Draft) / Đã xuất bản (Published) | Bản nháp / Đã xuất bản |
| Bài viết | Bài viết Blog / Ảnh đại diện | Bài viết / Ảnh bìa bài viết |
| Ảnh và tài liệu | Văn bản thay thế (Alt SEO) / Chọn một file / _object Key / Prefix | Văn bản thay thế (alt) / Chọn tệp / Mã lưu trữ / Thư mục lưu tệp |
| Tải nhiều tệp | Tải lên số lượng lớn / Đang tải lên `{{current}}` trong tổng số `{{total}}` | Tải nhiều tệp / Đang tải tệp `{{current}}/{{total}}` |
| SEO | Title / Description / Meta Image | Tiêu đề SEO / Mô tả SEO / Ảnh chia sẻ |
| Chỉ báo SEO | `{{current}}/{{max}}` đã đạt | Đạt `{{current}}/{{max}}` mục |
| Sản phẩm | Bảng giá và catalog (PDF) / Hiện ở nhãn nhìn nhanh / Đơn vị MOQ | Bảng giá và danh mục sản phẩm (PDF) / Hiện cạnh tên sản phẩm / Đơn vị đặt tối thiểu |
| Báo giá | Sản phẩm lúc gửi / Mới tiếp nhận / Hoàn tất / Đóng | Sản phẩm ghi trong yêu cầu / Mới / Hoàn tất |
| Cấu hình website | Cấu hình website & Liên hệ / Số Hotline bán sỉ / Ảnh Open Graph mặc định / Fanpage Facebook | Cấu hình website và liên hệ / Số điện thoại bán sỉ / Ảnh chia sẻ mặc định / Trang Facebook |

Giữ cách gọi quen thuộc như SKU, SEO và PDF, kèm tiếng Việt tại các nhãn cần giải nghĩa. Các nhãn trợ năng `Add block`, `Edit link`, `Remove link` của Lexical và `Notifications` của vùng thông báo do thư viện khai báo trực tiếp. Payload 3.93 chưa có khóa cấu hình để dịch các nhãn này. Khi nâng Payload, thử lại các khóa lỗi, hộp thoại một hoặc nhiều mục và các chuỗi SEO có biến nội suy.

| Giai đoạn | Hướng triển khai | Điểm cần xác minh |
| --- | --- | --- |
| 1 · Nền tảng | Tách token sáng/tối, component riêng và phần ghi đè Payload. Ánh xạ biến CSS trước, sau đó kiểm tra bảng, tab, trạng thái, toast, modal và toàn bộ nhóm field đã nêu. | Các dải elevation và semantic có nhiều nơi dùng. Đo màu thực sau cascade và kiểm tra lại Lexical, lỗi, disabled, dropdown trong modal. Xác nhận font tiếng Việt và ảnh hưởng bundle. |
| 2 · Menu, Đăng nhập, Việc hôm nay | Nhóm Bán hàng, Danh mục và nội dung, Thư viện, Cài đặt. Dùng slot login và Dashboard hiện có. Đề xuất “chờ lâu” là báo giá mới quá 24 giờ, chốt bằng hằng số và dùng chung ở Dashboard và danh sách. | Kiểm tra khả năng gắn icon mà vẫn giữ menu gốc. Lời chào theo giờ địa phương cần tránh lệch giữa SSR và trình duyệt. Kiểm tra điều kiện đếm thiếu ảnh và SEO trên dữ liệu thật với Payload và PostgreSQL, đặc biệt các giá trị rỗng và dữ liệu cũ. Đếm theo điều kiện tại DB hoặc truy vấn giới hạn với projection phù hợp, tránh đọc từng bản ghi liên quan. |
| 3 · Yêu cầu báo giá | Dùng cell và điểm gắn danh sách/chỉnh sửa cho chip, thời gian, bộ lọc và thao tác nhanh. Ghi qua API Payload có xác thực và access Admin hiện có. | Kiểm tra cập nhật trạng thái từ hai tab, làm mới dữ liệu và phản hồi lỗi. Xác minh số hợp lệ trước khi tạo link Zalo. Ghi chú nội bộ cần đề xuất trường và migration để duyệt riêng vì collection hiện chưa có trường tương ứng. |
| 4 · Soạn nội dung | Checklist đọc dữ liệu có sẵn và cập nhật theo giá trị đang nhập. Bám tiêu chí nội dung trong README và UI hiện tại. Tính độ hoàn thiện tức thời, giữ hành vi lưu. | Rà hình ảnh dùng ID so với object, máy chủ và biểu mẫu chứa dữ liệu cũ, tab ẩn, Lexical và alt ảnh. Chỉ tạo liên kết nhảy trường nếu API/form có đích ổn định. |
| 5 · Câu chữ | Lập bảng cũ → mới và duyệt các câu còn tranh cãi. Ghi đè khóa chuẩn qua bản dịch `vi` và sửa nhãn do dự án sở hữu. | Rà biến nội suy, số nhiều, lỗi xác thực và bản dịch của plugin. Giữ giá trị enum và mã định danh trong dữ liệu. |
| 6 · Rà soát | Chạy ma trận kiểm thử bàn phím, độ tương phản, giảm chuyển động, kích thước nhỏ, Node production và xác nhận phần có thể thử trên Workers. | Kiểm tra các luồng đăng nhập/quên mật khẩu, menu, báo giá, form Sản phẩm/Bài viết, Lexical, tải một/nhiều ảnh, PDF và sáng/tối. Lưu ảnh trước/sau của các màn hình đã đổi ngoài repo. |

Khi triển khai, kiểm tra trực tiếp ở desktop 1.440 px, máy tính bảng khoảng 768 px và điện thoại khoảng 390 px. Dùng `Tab`, `Shift+Tab`, `Enter`, `Space` và `Esc` trên luồng phù hợp. Chuyển theme bằng tùy chọn tài khoản Payload, lặp lại với giảm chuyển động. Bản Node local và Cloudflare Workers cần xác minh riêng ở bước rà soát.

## Giai đoạn 6 · Rà soát và checklist nâng cấp

### Tương phản và chuyển động

Chạy `node scripts/check-admin-contrast.mjs` để đọc trực tiếp biến màu trong `_tokens.scss`. Script đo 29 cặp mỗi chế độ và trả mã lỗi nếu có cặp dưới ngưỡng. Dùng ngưỡng 4,5:1 cho chữ thường và 3:1 cho dấu hiệu cần thiết của điều khiển. Các ngưỡng lấy từ [WCAG 2.2 · Tương phản chữ](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) và [WCAG 2.2 · Tương phản phi văn bản](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

| Cặp màu chính | Sáng | Tối |
| --- | ---: | ---: |
| Chữ chính trên nền trang | 15,75:1 | 16,27:1 |
| Chữ phụ trên nền trang | 7,43:1 | 10,00:1 |
| Chữ trên nút chính | 7,56:1 | 7,90:1 |
| Chữ trên chip báo giá thấp nhất | 5,88:1 | 5,88:1 |
| Chữ trên cảnh báo | 6,53:1 | 8,72:1 |
| Viền ô nhập trên nền trang | 3,54:1 | 4,03:1 |
| Vòng focus trên nền vùng chọn | 6,07:1 | 6,55:1 |
| Thanh checklist trên nền vùng chọn | 6,18:1 | 6,12:1 |

Đạt 58/58 phép đo màu chủ đề. Phép đo này bao phủ các cặp được liệt kê trong script. Khi bật giảm chuyển động, stylesheet của nhóm route Payload tắt transition, bỏ độ trễ và bỏ cuộn mượt. Animation CSS còn 0,01 ms để giữ sự kiện kết thúc cho thư viện. Hiệu ứng mừng đạt 100% vẫn chỉ được tạo khi người dùng cho phép chuyển động.

Kiểm tra màu thực tế trong Chromium cho thấy chữ gợi ý SEO trên nền sáng tăng từ 2,69:1 lên 7,43:1. Cùng vùng ở chế độ tối đạt 10,00:1. Màu chữ và nền của các chip thiếu, ngắn, gần đạt, đạt và quá dài đều vượt 4,5:1 ở cả hai chế độ sau khi áp dụng lớp tương thích.

### Kiểm thử trên bản Node production

| Luồng | Kiểm thử |
| --- | --- |
| Đăng nhập và Quên mật khẩu | Dùng `Tab` và `Shift+Tab` qua các ô, gửi thông tin thử bằng `Enter`, kiểm tra thông báo lỗi và mở trang Quên mật khẩu bằng bàn phím. |
| Menu, Tổng quan và báo giá | Mở menu bằng `Space`, thu gọn nhóm, chọn Báo giá, bật/tắt bộ lọc bằng bàn phím, truy cập ô nội dung yêu cầu và mở form sản phẩm từ đường tắt Tổng quan. |
| Form và Lexical | Đi từ tab đến trường nhập, xem vòng focus, thử các ngưỡng tiêu đề SEO, mở menu `/` và dùng `Esc`. |
| Ảnh và PDF | Dùng bàn phím đổi tùy chọn ảnh, lưu ảnh đơn, đọc bảng dung lượng và đóng. Lưu một lô gồm ảnh lớn được nén và ảnh nhỏ giữ kích thước. Tải PDF từ admin rồi đọc lại đúng loại tệp và dung lượng qua HTTP. |
| Hiển thị | Đo chiều rộng trang ở 390, 768 và 1.440 px trong hai theme. Các bảng rộng cuộn bên trong khung. Các nút chính được kiểm tra có chiều cao từ 44 px trên màn hình nhỏ. Khi bật giảm chuyển động, các phần tử hiển thị trong ma trận có thời lượng CSS tối đa 0,01 ms. |

Ở màn hình nhỏ, toast sau khi lưu ảnh có thể che một phần bảng kết quả trong thời gian thông báo còn hiện. Bảng kết quả vẫn nằm trên trang sau khi toast biến mất và nút Đóng thao tác được bằng bàn phím. Liên kết minh họa trong khung xem trước SEO và một số nhãn trợ năng được tạo bên trong plugin, cần rà lại khi nâng phiên bản.

### Selector cần rà thêm khi nâng Payload

| Selector | Phần giao diện cần thử lại |
| --- | --- |
| `.template-default`, `.template-default__nav-toggler-wrapper`, `.template-default__nav-toggler`, `.hamburger`, `.app-header__mobile-nav-toggler` | Ở tối đa 768 px, nút gốc có thể Tab phải hiện trong thanh trên với vòng focus nằm trọn trong nút. Nút trùng của Payload giữ chỗ ở thanh trên. Mở và đóng bằng `Space` hoặc `Enter`, sau đó kiểm tra vị trí focus và cuộn ngang khi chọn mục menu. |
| `.doc-controls__controls`, `.doc-controls__controls .btn`, `.template-minimal form .btn--style-primary`, `.bulk-upload--actions-bar__buttons .btn`, `.bulk-upload--actions-bar__controls .btn` | Đo nút Lưu, nút thao tác chính trong màn hình xác thực và nút chuyển ảnh trong drawer ở 390 và 768 px. Payload chuyển cụm Lưu của drawer xuống chân màn hình ở kích thước nhỏ. |
| `.field-type .rs__control:has(input:focus-visible)`, `.tabs-field__tab-button:focus-visible` | Tab vào relationship và select, kiểm tra vòng focus ở cả hai chế độ. Đổi tab trên điện thoại, kiểm tra vòng focus bên trong vùng cuộn ngang. |
| `.rich-text-lexical`, `.ContentEditable__root`, `.LexicalEditorTheme__placeholder`, `.LexicalEditorTheme__upload`, `.LexicalEditorTheme__upload__contents[data-align]`, `.thumbnail` | Kiểm tra dấu tiếng Việt trong ô nhập và dòng gợi ý. Chèn ảnh bằng `/`, kiểm tra thẻ ảnh chưa có căn lề riêng nằm giữa và vừa khung nhỏ. Mở bút chì và chỉnh thông tin từng ảnh. |
| `.admin-rich-text-image-width .field-error.tooltip` | Thông báo chiều rộng sai cần hiện ngay trong hộp chỉnh ảnh, kể cả ở kích thước điện thoại, nơi Payload mặc định ẩn tooltip. |
| `#field-meta` và selector thuộc tính `style` trong nhóm SEO | Plugin SEO 3.93 đặt màu gợi ý, màu chip, độ co và ngắt dòng bằng inline style. Thử thiếu, ngắn, gần đạt, đạt, quá dài, và cả hai trạng thái ảnh. Ưu tiên API style chính thức nếu bản mới cung cấp. |

### Checklist trước khi chấp nhận bản nâng cấp

- **Xác thực và điều hướng**. Kiểm tra đăng nhập đúng và sai, trang Quên mật khẩu, gửi và nhận email thật trên staging, đặt lại mật khẩu, đăng xuất và tạo Admin đầu tiên trên database trống dành cho kiểm thử. Mở menu bằng bàn phím, kiểm tra nhóm thu gọn và dùng đường tắt ở Tổng quan.
- **Danh sách và báo giá**. Kiểm tra tìm kiếm, lọc, cuộn bảng, chọn hàng, focus khi đóng hộp thoại, sao chép số và nội dung. Chuyển trạng thái bằng bản ghi thử, kiểm tra hai phiên chỉnh sửa đồng thời và đối chiếu với chi tiết.
- **Sản phẩm và Bài viết**. Mở bản cũ, tạo nháp, lưu và kiểm tra lỗi trùng đường dẫn. Đi qua tab bằng `Tab` và `Shift+Tab`, mở select bằng bàn phím. Kiểm tra checklist, tab SEO, xem trước, menu `/` của Lexical và drawer chèn ảnh/liên kết.
- **Thư viện ảnh và PDF**. Tải một ảnh lớn và hai ảnh trong cùng một lô. Kiểm tra độ nét, alt, chuyển dòng, hộp kết quả và nút đóng bằng bàn phím. Tải PDF rồi mở hoặc tải xuống tệp đã lưu.
- **Hiển thị và trợ năng**. Chạy script màu. Lặp lại bằng theme sáng/tối, chiều rộng 390/768/1.440 px, bàn phím, giảm chuyển động và trình đọc màn hình. Kiểm tra thêm trên thiết bị iOS và Android khi nghiệm thu staging.
- **Node và Workers**. Chạy lint, typecheck, test và build. Chạy CI OpenNext trên Linux, sau đó thử đăng nhập, lưu nội dung, tải ảnh và PDF qua R2 trên staging. Đối chiếu phiên bản Next.js, Payload, Lexical và SEO trước khi bỏ hoặc đổi selector tương thích.

### Mốc bàn giao

| Giai đoạn | Commit |
| --- | --- |
| 0 · Khảo sát và quy chuẩn | `f7a2a66` |
| 1 · Giao diện sáng và tối | `b9f6832` |
| 2 · Menu, Đăng nhập, Việc hôm nay | `094c8d4` |
| 3 · Tiếp nhận và xử lý báo giá | `15bedf9` |
| 4 · Checklist sản phẩm và bài viết | `58081c7` |
| 5 · Câu chữ tiếng Việt | `883cd52` |
| 6 · Trợ năng và kiểm thử | `fix(admin): improve keyboard and responsive accessibility` |

Kiểm tra cấu hình tĩnh Cloudflare đạt. `npm run cf:build` dừng tại esbuild trên Windows vì thiếu quyền đọc thư mục cha khi phân giải `open-next.config.ts`. Chạy lại pipeline OpenNext trên Linux và xác minh luồng admin trên staging có Hyperdrive và R2. Kiểm thử trên trình đọc màn hình, thiết bị iOS/Android thật, gửi email khôi phục và tạo Admin từ database trống là các bước bàn giao thủ công.
