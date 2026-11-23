# Tối ưu ảnh khi tải lên Payload Admin

Áp dụng cho ảnh mới gửi vào Media. Không xử lý lại ảnh cũ, không thêm dependency hay migration; access, Documents, cache/revalidate và các component công khai giữ nguyên.

## Cách dùng

Chọn ảnh trong `/admin` như trước. Trong phần **Tự động tối ưu trước khi tải lên**, chọn vị trí sử dụng và tùy chọn **Giữ chất lượng cao**, rồi bấm **Lưu**. Ảnh chỉ được xử lý sau khi bấm Lưu, trước khi gửi file qua mạng. Bảng kết quả hiện tên file, trạng thái chờ/xử lý/gửi/đã tải lên, dung lượng trước → sau và lỗi/cảnh báo tiếng Việt. Lưu thất bại ở server không được báo là đã tải lên.

Thiết lập được giữ riêng theo từng File trong phiên admin, kể cả khi chuyển qua lại các file trong drawer tải hàng loạt. Không lưu các lựa chọn này vào database. Tạo ảnh từ trang bài viết mặc định chọn 1.600 px; thư viện và các vị trí khác mặc định 2.000 px. Vì Media dùng lại ở nhiều vị trí, banner và SEO không được suy đoán theo tên file hoặc nội dung ảnh: người nhập chọn loại ảnh phù hợp. Ảnh có chữ/logo/sơ đồ cần bật chất lượng cao thủ công.

## Chính sách

Thông số tập trung trong `src/lib/image-upload-config.ts`: nguồn tối đa 20 MiB (UI ghi 20 MB), file nhỏ hơn 150 KiB được bỏ qua, mục tiêu khoảng 150–400 KiB, WebP 0,82 và chỉ thử giảm tới 0,78 khi còn lớn. Không tiếp tục hạ chất lượng để ép đạt mục tiêu.

| Loại | Cạnh dài tối đa |
| --- | --- |
| Sản phẩm / thư viện | 2.000 px |
| Banner / bài blog | 1.600 px |
| SEO / Open Graph | 2.000 px; không giảm xuống dưới 1.200 px khi nguồn đủ lớn |

Giữ tỷ lệ, không crop, không phóng to. Ngoại lệ giữ nguyên byte ảnh khi file đã nhỏ, ảnh động hoặc kết quả nén không nhỏ hơn; trong các trường hợp đó cạnh dài có thể lớn hơn mức đích. Tên file mới được chuẩn hóa bằng `toVietnameseSlug`, có đuôi theo MIME thật; Payload vẫn tự xử lý trùng tên.

Chế độ chất lượng cao dùng PNG lossless cho PNG/ảnh có alpha, JPEG 0,94 cho ảnh khác. Đây là lựa chọn chủ động để tránh pipeline Sharp hiện có trên Node mã hóa lại WebP ở chất lượng mặc định. Nếu PNG/JPEG tạo ra lớn hơn nguồn thì giữ byte nguồn. Chế độ thường ưu tiên WebP; nếu encoder không trả đúng MIME WebP, dùng JPEG khi không có alpha, PNG khi có alpha để giữ nền trong suốt.

Decoder `createImageBitmap(..., { imageOrientation: 'from-image' })` đọc EXIF, không xoay lần thứ hai; dự phòng dùng decoder HTMLImageElement. Canvas tạo file từ pixel nên không sao chép EXIF/GPS. **File được giữ nguyên hoặc gửi dự phòng vẫn có thể còn metadata**; đây là ngoại lệ của quy tắc giữ nguyên file và được nhắc trong UI.

Ưu tiên dedicated Web Worker + OffscreenCanvas, terminate sau mỗi ảnh. Thiếu hỗ trợ thì dùng canvas ở luồng chính; encode bất đồng bộ, các ảnh luôn được xử lý lần lượt. Giới hạn canvas 48 triệu pixel được kiểm tra sau decode, không phải cam kết chặn mọi lần cấp phát bộ nhớ của decoder. Lỗi giải mã/encode, Worker lỗi hoặc quá 45 giây: giữ nguồn dưới giới hạn kèm cảnh báo. Lỗi encode/OOM không bị thử lại bằng decoder ở luồng chính. Browser/OS hết bộ nhớ và đóng cả tab vẫn là giới hạn không thể bắt bằng JavaScript.

## Tích hợp Payload 3.93

Đã đối chiếu `@payloadcms/ui/dist/forms/Form/index.js`, `elements/BulkUpload/FormsManager/{index,createFormData}.js`, `payload/dist/uploads/{types.d.ts,generateFileData.js,checkFileRestrictions.js}` và API providers/UI field trong bản cài. Hook `useUploadHandlers` dành cho storage upload, không phải hook thay File trước mọi request; không dùng nó sai mục đích.

Provider đăng ký qua `payload.config.ts` và importMap. Nó bọc `window.fetch` trong thời gian admin mount, chỉ xử lý request multipart cùng origin, phương thức POST/PATCH/PUT vào đúng `/api/media` hoặc `/api/media/<id>`, có File ở khóa `file`. Giữ nguyên `_payload`, mọi field khác, credentials, headers, signal và response của Payload; khôi phục fetch khi unmount. Cả form đơn, upload drawer, ảnh trong Lexical, SEO, danh mục, banner dùng Media và bulk upload của phiên bản này đều đi qua đường này. Documents và URL upload của storage khác không bị can thiệp.

UI field `uploadOptimization` chỉ phục vụ quản trị, bị loại khỏi cột danh sách, không sinh cột hoặc dữ liệu lưu. Khi nâng Payload phải kiểm tra lại hai luồng multipart vì đây là adapter cho transport thực tế của 3.93, không phải API transform chính thức. Nếu sau này bật direct-to-R2 client uploads hoặc thay upload bằng XHR/Request có body nội tại, cần bổ sung tích hợp tương ứng; chưa cấu hình các luồng đó trong repo hiện tại.

Hook `beforeOperation` của Media kiểm tra giới hạn cứng và chữ ký JPEG/PNG/WebP/AVIF trước generateFileData/storage, kể cả qua REST/GraphQL/Local API. Payload tiếp tục kiểm tra file riêng. Hook chạy sau khi multipart đã được parser đọc; không phải biện pháp giới hạn băng thông/bộ nhớ trước parser. Không đặt giới hạn global mới để tránh tác động PDF.

**SVG/GIF:** bộ nén bỏ qua và giữ byte nguồn, nhưng allowlist Media hiện có vẫn chỉ nhận JPEG/PNG/WebP/AVIF. SVG/GIF tiếp tục bị server từ chối, không mở thêm định dạng trong tác vụ này. APNG, WebP động và AVIF sequence được nhận biết để tránh làm mất animation ở phía client. Pipeline ảnh sẵn có của Payload trên Node vẫn có thể mã hóa lại WebP; dung lượng cuối trong Media có thể lệch nhẹ so với con số trước khi gửi. Không thay pipeline variant của Node.

## Đối chiếu hiển thị

| Vị trí hiện có | Kích thước CSS/sizes | Nhận xét |
| --- | --- | --- |
| ProductGallery | Desktop khoảng 590 px; mobile tới chiều rộng viewport | 2.000 px đủ cho desktop DPR 2/3; điện thoại ngang rộng ở DPR cao vẫn có thể thiếu pixel nguồn |
| ProductCard / grid | Tối đa khoảng 330–448 px trong shell | 2.000 px đủ dư, không đổi `sizes` |
| HomeBanner | Nhánh rộng 560 px; nhánh giữa 36vw; mobile 80vw | 1.600 px hợp lý cho DPR 2. Banner đầu vẫn dùng ảnh tĩnh `/images/home/…`, không đi qua upload Media |
| PostDetail cover | 1.152 px | 1.600 px không đủ nét 1:1 ở DPR 2 (cần 2.304 px); giữ đúng yêu cầu 1.600 px, không sửa component |
| LexicalContent | `sizes` tối đa 768 px nếu có srcSet | 1.600 px đủ xấp xỉ DPR 2 ở nhánh này; fallback không có srcSet dùng nguyên file |

Server Node vẫn có các variant crop 480×360, 800×600 và 1600×900. Bộ nén không crop ảnh gốc; helper rich text hiện có tiếp tục chỉ nhận srcSet cùng tỷ lệ. `MediaImage` vẫn ưu tiên variant như trước. Không sửa component hay sizes để che các giới hạn này.

## Kiểm chứng

- 93 unit tests đạt; test mới gồm giới hạn, kích thước/tỷ lệ, không phóng to, tên tiếng Việt, format/alpha/chất lượng cao, chữ ký MIME, animation marker, transport đơn/bulk, dữ liệu multipart, loại trừ Documents/cross-origin, hủy/lỗi không gửi file và không làm hỏng hàng đợi.
- Typegen + TypeScript (`lint` cũng là tsc) và Node production build đạt. Chỉ có cảnh báo webpack snapshot cache của môi trường trước đó. Máy không có `npm` trong PATH nên chạy các entrypoint Node/tsx tương đương; không sửa package script.
- Tạo migration thử `payload migrate:create image_upload_schema_check --skip-empty`: không sinh file, không đổi schema.
- 11 kiểm thử trình duyệt Chromium đạt bằng harness dùng chính module nguồn: Worker resize/WebP, editorial 1.600 px, EXIF orientation 6, loại EXIF đầu ra, alpha, JPEG/PNG chất lượng cao, file nhỏ giữ byte, SVG/GIF passthrough của bộ nén, file hỏng dự phòng, >20 MiB bị chặn, HTML canvas fallback.
- Admin thực tế: tải một JPEG 5,8 MB, chọn editorial; browser xuất khoảng 843 KiB, Media lưu WebP 1600×1067 khoảng 840 KiB sau pipeline Node. Tải hàng loạt ảnh điện thoại + ảnh nhỏ thành công; lựa chọn theo từng File giữ nguyên khi chuyển dòng. Drawer tạo Media trong trường SEO sản phẩm có đủ UI tối ưu.
- REST bỏ qua client: nguồn >20 MiB trả 413; JPEG giả, PDF và SVG không được phép trả 400. Dữ liệu thử chỉ nằm local và được dọn sau kiểm tra.
- Chưa kiểm thử trên Safari/iOS thật, giả lập encoder WebP thiếu hỗ trợ ở trình duyệt thật, OOM thật hay môi trường Cloudflare đã triển khai. Worker asset được build bởi Webpack; code nén chạy trong browser và không import Sharp. Chưa thử tay từng drawer Lexical/danh mục/banner; chúng dùng chung collection và transport đã đối chiếu ở bản cài.

Log/harness ngoài repo: `work/image-upload-tests.log`, `work/image-upload-build.log`, `work/image-upload-browser-results.json`, `work/image-upload-server-results.json`; ảnh minh chứng `outputs/image-upload-admin.jpg`.

## Kiểm tra thủ công trong /admin

1. JPEG lớn: chọn loại sản phẩm rồi banner; lưu và kiểm tra cạnh dài 2.000/1.600 px, tên, MIME, bảng trước → sau.
2. Ảnh điện thoại EXIF xoay: kiểm tra đúng chiều trong thumbnail và ảnh gốc lưu.
3. PNG trong suốt: kiểm tra nền/biên trong suốt; bật chất lượng cao để giữ PNG.
4. Ảnh có chữ/logo/sơ đồ: bật chất lượng cao, so sánh chữ sau lưu; chấp nhận file lớn hơn mục tiêu.
5. SVG/GIF: hiện bị chặn bởi policy Media; đây không phải lỗi encoder. File nhỏ được phép như JPEG/PNG giữ byte nguồn.
6. File >20 MB: không gửi lên server, báo lỗi tiếng Việt. File hỏng có cảnh báo client; server vẫn có quyền từ chối file không hợp lệ.
7. Bulk upload: đổi chất lượng/loại ở từng dòng, chuyển qua lại, lưu; kiểm tra xử lý tuần tự và lỗi một ảnh không chặn ảnh khác.
8. Tạo Media từ ảnh sản phẩm, Lexical, danh mục, SEO, banner và blog; chọn đúng profile khi dùng ảnh chung. Mở ảnh cũ rồi lưu metadata: không có File mới nên không chạy nén.

Script Sharp tối ưu lại ảnh cũ chưa được thực hiện.

## File của thay đổi này

- `src/lib/image-upload-config.ts`, `image-upload.ts`, `image-compression-codec.ts`, `image-compression-client.ts`, `image-compression.worker.ts`, `media-upload-transport.ts`, `media-upload-validation.ts`, `image-upload.test.ts`.
- `src/admin/ImageUploadProvider.tsx`, `MediaUploadOptions.tsx`, `image-upload.css`.
- `src/collections/Media.ts`, `src/payload.config.ts`, `src/app/(payload)/admin/importMap.js` và báo cáo này.

Những chỉnh sửa trang chủ/header đã có trong working tree từ trước được giữ nguyên, không gom vào thay đổi nén ảnh.
