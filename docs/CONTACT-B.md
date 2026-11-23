# Trang Liên hệ – hướng B

Đã dựng lại phần bắt buộc từ bố cục tham chiếu, bằng component và CSS của repo. Không sao chép HTML/CSS tham chiếu. Xem tại `http://localhost:3000/lien-he` hoặc `/lien-he#bao-gia`.

## Giao diện và hành vi

- Nền xanh xám #F2F4F1, ô trắng bo 28 px, xanh thương hiệu #1F3B35 và nút vàng #F2B84B. Dùng lại token header; thêm token viền, bo ô nhập, vòng focus và màu lỗi. Dùng font Be Vietnam Pro đang có.
- Desktop dùng lưới 12 cột: form chiếm 7, thông tin chiếm 5. Hai cột tự giãn bằng nhau, nút gửi và nút chỉ đường nằm sát đáy tương ứng; không khóa chiều cao. Mở details/hiện lỗi vẫn giữ thẳng đáy. Mobile xếp tiêu đề → Gọi/Zalo → form → thông tin. Nếu không có thông tin liên hệ, ẩn hẳn sidebar và căn form trong khung đơn.
- Form vẫn có tên, điện thoại, message, quantity bắt buộc. Message và quantity nằm cạnh nhau từ 640 px. Ô nhập cao thực tế 54 px; textarea 144 px. Email/công ty nằm trong details, tự mở trước khi chuyển focus đến lỗi. Vòng focus đúng màu thương hiệu và rộng 3 px.
- Giữ nguyên props `productId`, `productName`, `defaultQuantity`, toàn bộ payload gửi, honeypot, formLoadedAt, xử lý phản hồi và dữ liệu đặt lại. Thêm context chỉ truyền Zalo đã resolve từ server để màn hình thành công không phải lấy cấu hình lần nữa hay thêm prop.
- Thành công hiển thị dấu tích, “Đã nhận yêu cầu”, mã thật từ API, lời xác nhận của server, Zalo nếu có và nút gửi thêm. Gửi thêm trả form về mặc định của từng trang và focus ô tên. Không thêm cam kết thời gian phản hồi.
- Đọc `searchParams` dạng Promise. `/lien-he?sanpham=<slug>#bao-gia` chỉ điền sản phẩm đã xuất bản từ hàm truy vấn hiện có, gồm mã SKU và MOQ nếu có. Tham số lặp, slug sai, không tìm thấy hoặc sản phẩm nháp đều bị bỏ qua. Liên kết “Gửi yêu cầu báo giá theo quy cách” trên sản phẩm công khai dùng đường dẫn này; trong preview vẫn trỏ tới thông báo xem trước.
- Tối đa hai điện thoại được chuẩn hóa/loại trùng bằng cùng helper của header. Email và điện thoại là liên kết; chỉ đường dùng Google Maps search với địa chỉ được encode, mở tab mới an toàn.
- ContactActions ẩn kênh chưa có dữ liệu; compact không còn kênh thì trả null. Đã rà soát các nơi dùng ở Giới thiệu và bài viết. Footer cũng ẩn dòng thiếu dữ liệu để trang không còn “Chưa cấu hình”; hotline thứ hai hiển thị cùng dữ liệu header. SampleNotice ẩn riêng ở Liên hệ, vẫn giữ ở những trang khác và không xóa trường.
- Metadata Liên hệ dùng mô tả trung tính có tên thương hiệu. Canonical, robots và force-dynamic giữ nguyên. Thêm ContactPage JSON-LD qua JsonLd/serializeJsonLd; mainEntity Organization chỉ có dữ liệu thật. Giờ làm việc hiện là chuỗi tự do nên đưa vào description, không suy diễn OpeningHoursSpecification hay tạo tọa độ/đánh giá/giá.

## Phạm vi giữ nguyên

Không sửa `quote-validation.ts`, `quote-body.ts`, `quote-client.ts`, `/api/bao-gia`, collection/schema QuoteRequests, phân quyền hay rate limit. Không thêm thư viện, khóa bản đồ hoặc thay đổi cache/revalidate, hạ tầng Cloudflare. Phần form/thông tin liên hệ ban đầu không cần migration; bổ sung bản đồ sau đó có một trường tùy chọn, mô tả bên dưới.

Chưa làm các trường thời gian phản hồi, giao hàng, QR Zalo, FAQ và các bước làm việc. Các khối này không xuất hiện và không có chữ giữ chỗ.

## Bổ sung bản đồ theo yêu cầu tiếp theo

Người dùng chọn bản đồ trải ngang bên dưới hai cột. Thiết kế dạng bưu thiếp: khung trắng bo góc, phần thông tin bên trái, nền xanh nhạt với đường nét trang trí và ghim vàng bên phải. Đây là ảnh bìa trang trí, không phải bản đồ địa lý hay vị trí giả. Bấm **Mở bản đồ tương tác** mới tạo iframe; Đóng bản đồ xóa iframe và trả focus về nút mở. Thanh Đóng nằm ngoài iframe, không che nội dung/điều khiển/ghi công của Google Maps.

Trong SiteSettings có trường tùy chọn **Bản đồ trang Liên hệ** (`contactMapEmbedUrl`). Nhận URL hoặc HTML sao chép từ **Google Maps → Chia sẻ → Nhúng bản đồ**, chỉ trích xuất URL HTTPS tại `www.google.com/maps/embed` có `pb`; bỏ toàn bộ HTML, thuộc tính và tham số khác. Không nhận URL từ host khác, link rút gọn, credentials hay Embed API v1 có API key. Cách lấy mã nhúng dựa trên [hướng dẫn Google Maps](https://support.google.com/maps/answer/7101463?hl=en).

Migration `20261123_025728_contact_map_embed` chỉ thêm `site_settings.contact_map_embed_url varchar` nullable. Đã áp dụng local, sinh lại types; trên môi trường khác chạy `npm run db:migrate` trước khi khởi động bản cập nhật. Không thay dữ liệu địa chỉ cũ.

Chưa có vị trí thật: SiteSettings hiện là “Kho mẫu minh họa – Khu công nghiệp Tân Bình, TP. Hồ Chí Minh”, trường mã nhúng đang trống. Bản đồ trên trang thật được ẩn cho đến khi có mã nhúng hợp lệ và địa chỉ. Đã hỏi người dùng link Google Maps/địa chỉ chính xác, chưa nhận được. Bản xem thử ngoài repo dùng iframe mô phỏng local, không gán nhầm vị trí Google Maps. Chưa kiểm thử tải Google Maps thật. Repo hiện không có frame-src/CSP chặn iframe; không thay header hay cơ chế bảo mật.

## Kiểm chứng

- 98 unit test đạt, gồm toàn bộ quote-transport, ba test về tham số điền sẵn/dữ liệu liên hệ/JSON-LD và hai test chuẩn hóa URL/mã nhúng bản đồ.
- Typegen + TypeScript và Node production build đạt. `lint` của repo cũng là TypeScript. Môi trường không có npm trong PATH nên chạy entrypoint Node/tsx tương đương. Build chỉ còn cảnh báo webpack snapshot cache đã có trước.
- Thử tay trên Chromium: lỗi bắt buộc, gửi thành công và đặt lại ở Liên hệ, Giới thiệu, sản phẩm; thêm một lượt từ liên kết điền sẵn và một lượt khi toàn bộ liên hệ trống. Kiểm tra bản ghi lưu đúng productId, snapshot, quantity, message, sourceUrl. Năm bản ghi thử đã xóa; yêu cầu có sẵn giữ nguyên.
- Email sai/công ty quá dài trong details đã đóng: details tự mở, aria-invalid/aria-describedby đúng và focus vào email. Chỉ lỗi công ty trên mobile: focus đúng ô và ô/thông báo vẫn nằm phía trên dock liên hệ.
- Slug không tồn tại, sai định dạng, tham số lặp và slug sản phẩm nháp đều trả trang 200 với form bình thường; canonical không mang query. Kiểm tra HTML có một H1, ContactPage JSON-LD, không có iframe.
- Kiểm tra 390/1280/1440 px, không tràn ngang; mobile giữ thứ tự yêu cầu. Ô nhập và nút đủ chiều cao; các kênh liên hệ hiển thị đủ dữ liệu. Với email dài bất thường, cho phép ngắt dòng để giữ đầy đủ nội dung.
- Neo #bao-gia nằm dưới header sticky: quan sát top form khoảng 92 px, đáy header khoảng 76 px ở desktop. Menu Liên hệ giữ aria-current.
- Thử cấu hình trống toàn bộ và cấu hình chỉ còn hotline chính: không có sidebar/khối rỗng hay chữ “Chưa cấu hình”. Không có Zalo thì màn hình thành công không có nút Zalo. Cấu hình gốc đã khôi phục đầy đủ.
- Tương phản chính: chữ tối/vàng 8,84:1; trắng/xanh 12,10:1; chữ phụ/nền 5,09:1; lỗi/trắng 7,26:1. Chuyển động mới chỉ dùng transform, 160 ms và nằm trong prefers-reduced-motion: no-preference.

Chưa thử trên Safari/iOS thật hoặc deployment Cloudflare; không deploy hay push trong tác vụ này. Thông báo độ dài companyName đang được API/Zod trả tiếng Anh; giữ nguyên nội dung lỗi theo ràng buộc không sửa validation.

## File đổi/thêm

- `src/app/(frontend)/lien-he/page.tsx`, `contact.css`: trang, metadata và bố cục.
- `src/components/QuoteRequestForm.tsx`, `quote-request.css`: giao diện form, details, thành công và focus.
- `src/components/ContactActions.tsx`, `contact-actions.css`: nút dùng chung và ẩn kênh trống.
- `src/components/ContactInformation.tsx`: các ô liên hệ.
- `src/components/QuoteContactProvider.tsx`, `src/app/(frontend)/layout.tsx`: cấp Zalo cho form mà không đổi props.
- `src/components/ProductDetail.tsx`: liên kết sang form điền sẵn.
- `src/components/SiteFooter.tsx`, `SiteSampleNotice.tsx`: bỏ thông tin trống và ẩn sampleNotice ở Liên hệ.
- `src/app/(frontend)/header-tokens.css`: token dùng chung cho ô nhập.
- `src/lib/contact-page.ts`, `contact-page.test.ts`: helper và unit test.
- `src/components/ContactMap.tsx`, `src/lib/contact-map.ts`, `contact-map.test.ts`: bưu thiếp bản đồ, nạp khi bấm và kiểm tra mã nhúng.
- `src/globals/SiteSettings.ts`, `src/payload-types.ts`, `src/migrations/index.ts`, `20261123_025728_contact_map_embed.ts/.json`: cấu hình và migration bản đồ.
- `docs/CONTACT-B.md`: báo cáo này.

Những thay đổi trang chủ, zoom và nén ảnh đang có sẵn trong working tree được giữ nguyên. Bằng chứng ngoài repo nằm trong `work/contact-{tests,build}.log`, `work/contact-{html,form,responsive}-results.json`; ảnh tại `outputs/contact-B-*.jpg`.
