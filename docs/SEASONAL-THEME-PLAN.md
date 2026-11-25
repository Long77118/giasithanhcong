# Giai đoạn 0 · Giao diện theo mùa

Giáng sinh dùng tông xanh rừng và sage của trang chủ, với ánh champagne ở dây đèn, quả châu và nơ hộp quà. Tuyết nhẹ là chuyển động chính. Các chi tiết còn lại tập trung ở mép header, góc banner trang chủ và mép footer để ảnh sản phẩm và thao tác báo giá vẫn là trọng tâm.

## Khung giao diện hiện tại

`src/app/(frontend)/layout.tsx` dựng header, `main#main-content`, footer và thanh liên hệ nhanh như các phần tử cùng cấp. Trang xem trước dùng chung layout này. `/admin` có root layout riêng trong `(payload)`.

| Lớp hiện có | Vị trí và mức xếp lớp | Phương án tích hợp |
| --- | --- | --- |
| Header và menu danh mục | `.site-header` sticky, `z-index: 30`. Hàng trên desktop được đo bằng `ResizeObserver`; thanh dưới đã có bóng khi `data-pinned` bật. | Đặt SVG dây đèn trong lớp trang trí ở mép thanh dưới. Dùng bóng hiện có trên desktop và chỉ bổ sung trên điện thoại nếu cần. |
| Thanh tiến độ đọc bài viết | `.article-progress` fixed, `z-index: 31`, cao `4px` khi trình duyệt hỗ trợ scroll timeline và người dùng cho phép chuyển động. | Ưu tiên thanh đọc bài hiện có. Thanh mùa lễ nằm trong mép header và tự ẩn ở trang đang hiển thị thanh đọc bài. |
| Thanh liên hệ nhanh | `.site-contact-dock` fixed, `z-index: 35`. Hiện dưới `80rem`, chừa chỗ gồm cả vùng an toàn của thiết bị. | Đặt nút bật/tắt tuyết trong luồng nội dung của footer, có nhãn trạng thái và vùng bấm tối thiểu 44px. |
| Thanh liên hệ chi tiết sản phẩm | `.product-detail-dock` fixed, `z-index: 40`. CSS hiện tại ẩn thanh này khi có dock chung. | Giữ cơ chế hiện tại. |
| Dải xem trước | `.preview-banner` fixed, `z-index: 45`, đã đẩy header xuống. | Tắt toàn bộ giao diện theo mùa trên `/xem-truoc` và các đường dẫn con. |
| Liên kết bỏ qua điều hướng và hộp thoại | Liên kết `#main-content` ở `z-index: 50` khi có focus. Tìm kiếm, menu di động và thông tin thẻ sản phẩm dùng `<dialog>` trong lớp trên cùng của trình duyệt. | Đặt canvas dưới header với `z-index: 10`, `pointer-events: none` và `aria-hidden`. Các điều khiển mùa lễ nằm trong thứ tự Tab thông thường. |

Layout dùng `settings` từ lượt gọi `getSiteSettingsCached()` hiện có để tính lịch trên server. Khi hiệu lực, layout mới truyền cấu hình hiển thị vào khung frontend. Cổng hiển thị theo dõi đường dẫn qua `usePathname` và trạng thái dự phòng trong `main` để nhận biết lỗi, 404 và xem trước. Layout App Router được dùng lại khi điều hướng nội bộ, nên chỉ dựa vào một lần tính đường dẫn ở server sẽ bỏ sót các lần chuyển trang. Đề xuất dùng dấu hiệu ở `error.tsx` và `not-found.tsx`, đặt `data-season="christmas"` trên `body` chỉ khi màn hình đủ điều kiện và dọn hiệu ứng khi chuyển vào màn hình bị loại trừ. Kiểm tra cả lần truy cập trực tiếp và chuyển trang mềm có streaming.

Điểm gắn canvas là một lớp cùng cấp với header, `main` và dock. SVG trong banner, tiêu đề và footer nằm tuyệt đối ở mép khối, ngoài vùng chữ. Dải thông báo nằm trước header sticky. Trong giai đoạn 3 cần kiểm tra chỗ dành cho dải thông báo ở lần vẽ đầu tiên và khi khách đã lưu trạng thái đóng, để phần đếm ngược sau mount không đẩy nội dung xuống.

Tách phần tuyết và hiệu ứng tương tác bằng `import()` ở phía client sau khi qua cổng hiển thị. Tài liệu Next.js đang cài lưu ý rằng import động Client Component từ Server Component không tự đảm bảo chia bundle. Vì vậy cần kiểm chứng asset thực tế trong tab Network của bản production khi tắt hoặc ngoài lịch, kể cả khi chuyển trang nội bộ.

## Đề xuất cấu hình CMS

Thêm một nhóm có tên `seasonalTheme` với nhãn **Giao diện theo mùa** trong SiteSettings. Các tùy chọn phụ thu gọn khi tắt. Trước khi áp dụng migration, dữ liệu hiện có vẫn dùng schema hiện tại. Sau migration, cài đặt trống sẽ được hiểu là tắt.

| Trường | Nhãn quản trị | Kiểu và mặc định | Mô tả |
| --- | --- | --- | --- |
| `enabled` | Bật giao diện theo mùa | Checkbox, **tắt** | Một công tắc để bật hoặc dừng toàn bộ hiệu ứng. |
| `theme` | Chủ đề | Select, `christmas` | Hiện có lựa chọn **Giáng sinh**. |
| `startsOn` | Ngày bắt đầu | Ngày, trống | Từ đầu ngày đã chọn theo giờ Việt Nam. Để trống nếu muốn bật ngay khi công tắc được bật. |
| `endsOn` | Ngày kết thúc | Ngày, trống | Hiển thị hết ngày đã chọn theo giờ Việt Nam. Để trống nếu muốn duy trì đến khi tắt thủ công. |
| `intensity` | Mức tuyết rơi | Select, `light` | **Nhẹ**, **Vừa** hoặc **Mạnh**. Điện thoại giảm khoảng một nửa số hạt trước khi xét hiệu năng. |
| `snowEnabled` | Tuyết rơi | Checkbox, bật | Khách có thể tắt tuyết riêng trên trình duyệt của mình. |
| `lightsEnabled` | Dây đèn đầu trang | Checkbox, bật | Dây đèn ở mép header, gọn hơn trên điện thoại. |
| `decorationsEnabled` | Trang trí Giáng sinh | Checkbox, bật | Hộp quà, cành thông và quả châu ở các điểm nhấn đã chọn. |
| `scrollEffectsEnabled` | Hiệu ứng khi cuộn | Checkbox, bật | Hiện dần, parallax trang trí và tiến độ cuộn. |
| `announcementEnabled` | Dải thông báo | Checkbox, **tắt** | Bật sau khi đã nhập nội dung hiển thị. |
| `announcementText` | Nội dung thông báo | Text, trống, tối đa 100 ký tự | Chữ thuần do quản trị viên nhập. Chuỗi trống sau khi bỏ khoảng trắng sẽ ẩn dải. |
| `announcementHref` | Đường dẫn thông báo | Text, trống | Đường dẫn nội bộ bắt đầu bằng `/` hoặc URL HTTPS hợp lệ. |

Ngày là giá trị lịch `YYYY-MM-DD`. Đề xuất dùng ô chọn ngày HTML trong field text của Payload để giữ ngày đúng như đã chọn dù trình duyệt quản trị ở múi giờ khác. Field DateTime của Payload 3.93 lưu ISO timestamp và có nhánh xử lý theo múi giờ riêng. Validate trên server theo ngày lịch thật, bao gồm năm nhuận, và báo lỗi tiếng Việt nếu ngày kết thúc đứng trước ngày bắt đầu.

Hàm thuần trong `src/lib/seasonal-theme.ts` nhận cấu hình và thời điểm hiện tại, tính theo `Asia/Ho_Chi_Minh`. Hai biên lịch đều tính trọn ngày. Đếm ngược dùng mốc **00:00 ngày 26/12** của năm hiện tại tại Việt Nam và ẩn sau khi qua mốc trong năm đó. Cấu hình trống, sai ngày hoặc chủ đề chưa hỗ trợ đều được xử lý an toàn. Nếu giao diện đang mở qua thời điểm kết thúc, phần hiệu ứng đã nạp tự tháo gỡ; khách đang mở trang từ trước khi bắt đầu lịch cần tải lại để nhận giao diện mới.

Cấu hình mùa lễ nằm cạnh dữ liệu SiteSettings, tách khỏi `resolveContactConfig` trong `contact.ts`. Global hiện đọc công khai và chỉ admin cập nhật. Giữ quyền và hook `afterChange` hiện có. Node dùng tag `site-settings` và TTL 300 giây, hook `safeRevalidateTags` làm mất hiệu lực ngay trong lần gọi lại server. Bản Cloudflare thử nghiệm đang bỏ qua persistent cache và đọc CMS trực tiếp. Sau khi quản trị viên đổi cấu hình, kiểm tra bằng tải lại trang hoặc yêu cầu mới; các tab khách đang mở không tự đồng bộ từ CMS.

### Migration sau khi duyệt

Tạo migration cộng thêm cho nhóm `seasonalTheme`, dự kiến thêm cột vào `site_settings` và enum cho các trường chọn nếu trình tạo schema sinh ra. Rà soát SQL `up` và `down`, snapshot và `src/migrations/index.ts`. Chạy trên bản sao database với tài khoản migration `SQL_ADMIN_USER` theo README, rồi kiểm tra setting cũ và giá trị mặc định tắt. PostgreSQL adapter đang đặt `push: false`.

```sh
npm run payload:types
npm run payload:importmap
npm run db:migrate:create -- seasonal_theme
npm run db:migrate
```

## Màu chữ và nền

Các biến `--season-*` được khai báo trong CSS riêng và áp dụng dưới `data-season="christmas"`. Các tỷ lệ dưới đây được tính bằng script Node theo độ chói tương đối sRGB. Mọi cặp chữ đã chọn đều đạt 4,5:1 cho văn bản thường và 3:1 cho văn bản lớn.

| Phần hiển thị | Chữ | Nền | Tương phản |
| --- | --- | --- | ---: |
| Thông báo và số đếm ngược | Sage `#eaf0dc` | Xanh rừng `#22392b` | 10,66:1 |
| Liên kết thông báo có gạch chân | Champagne `#efd49c` | Xanh rừng `#22392b` | 8,63:1 |
| Nút tuyết | Xanh rừng `#22392b` | Sage `#eaf0dc` | 10,66:1 |
| Nút tuyết khi hover và nút đóng thông báo | Xanh rừng `#22392b` | Champagne `#efd49c` | 8,63:1 |

Đỏ gạch `#a3422f` dành cho điểm trang trí nhỏ. Vòng focus dùng champagne trên nền xanh rừng và xanh rừng trên nền sage hoặc champagne. Dây đèn ấm thay đổi độ sáng nhẹ theo chu kỳ khoảng 3 giây, giảm số bóng trên màn hình nhỏ. SVG là hình tự vẽ và toàn bộ lớp trang trí có `aria-hidden`.

## Các bước sau khi duyệt

| Giai đoạn | Việc làm và điểm kiểm tra |
| --- | --- |
| 1 · Cấu hình | Thêm nhóm và migration, tạo kiểu Payload, kiểm tra cache sau khi lưu, test lịch trước/trong/sau, ngày trống, ngày nhuận, đổi năm, số hạt và đếm ngược. |
| 2 · Tuyết và đèn | Nạp canvas lúc rảnh, giới hạn DPR, giảm hạt khi thời gian khung hình tăng, dừng ở tab ẩn và dọn timer/listener khi tháo. Kiểm tra nút tuyết, lưu trạng thái bọc `try/catch`, Tab, dock, mức chuyển động và dây đèn. |
| 3 · Thông báo và SVG | Thêm đếm ngược sau mount, không dùng `aria-live`, lưu trạng thái đóng theo thông báo. Trang trí bằng bông tuyết, ngôi sao, quả châu, hộp quà và cành thông gốc. Kiểm tra dải thông báo ở 320px, lần tải lại sau khi đóng và CLS. |
| 4 · Cuộn trang | Tạo tiện ích `data-reveal` dùng chung vì các observer hiện tại phục vụ từng component riêng. Trong mùa lễ, gắn vào khối trang chủ, thẻ sản phẩm/bài viết trên các trang danh sách và trang giới thiệu. Chỉ nhắm phần tử dưới màn hình đầu, giới hạn độ trễ so le. Nội dung hiện mặc định với no-JS, trình duyệt thiếu observer hoặc giảm chuyển động. Nếu phần tử có focus, hiện ngay. Dùng `@supports` cho parallax và tiến độ, rồi kiểm tra cùng thanh đọc bài và bóng header hiện tại. |
| 5 · Rà soát | So sánh LCP/CLS/TBT với cùng dữ liệu và thiết bị giả lập. Kiểm tra Chrome desktop/mobile, bản Cloudflare thử nghiệm, no-JS, giảm chuyển động, tab ẩn, ngoài lịch, xem trước, lỗi/404, bật/tắt CMS và tab Network. Viết `docs/SEASONAL-THEME.md` với cách vận hành, tắt khẩn cấp và hướng mở rộng thêm chủ đề. |

Rủi ro cần kiểm chứng sớm là layout lưu lại qua điều hướng nội bộ, tài nguyên bị Next.js preload khi tắt, dải thông báo gây dịch bố cục và canvas tốn pin trên điện thoại. Đo trong bản build và kiểm tra trực tiếp các trường hợp chuyển trang, đóng dải rồi tải lại, cùng thời điểm hết lịch. Các trang chi tiết chỉ dùng lớp trang trí ngoài nội dung.
