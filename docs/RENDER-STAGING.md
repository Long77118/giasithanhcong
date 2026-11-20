# Deploy web và admin lên Render Free

Blueprint tạo một Web Service Node.js tại Singapore. Web, `/admin` và API chạy chung trên URL `onrender.com`. Ứng dụng dùng database Neon `giasithanhcong_staging` và bucket R2 private `giasithanhcong-staging-media` đã có. Bản staging luôn noindex.

## 1. Lấy thông tin Neon

1. Vào **Neon → giasithanhcong → Connect**. Chọn branch `staging`, database `giasithanhcong_staging`, role `giasithanhcong_app`. Tắt **Connection pooling** để lấy host trực tiếp.
2. Chuẩn bị `SQL_HOST` là phần sau `@` và trước dấu `/` đầu tiên trong chuỗi PostgreSQL. Chỉ lấy hostname, chẳng hạn `ep-...ap-southeast-1.aws.neon.tech`.
3. Chuẩn bị `SQL_PASSWORD` là mật khẩu thật của role `giasithanhcong_app`. Nếu lấy từ chuỗi PostgreSQL, các ký tự `%xx` trong mật khẩu có thể đã được mã hóa URL. Dùng giá trị mật khẩu gốc.

Blueprint đã điền tên database, app role và TLS. Staging hiện tại đã có dữ liệu, admin và migration ảnh. Dùng tài khoản admin website hiện có để đăng nhập. Mật khẩu role ứng dụng chỉ dùng cho kết nối database.

## 2. Tạo khóa R2 cho Render

1. Trong [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2/overview), mở **Manage API Tokens → Create Account API token**.
2. Chọn **Object Read & Write** và giới hạn vào riêng bucket `giasithanhcong-staging-media`.
3. Giữ **Public Development URL** ở trạng thái **Disabled**. Lấy **S3 API endpoint**, **Access Key ID** và **Secret Access Key**. Endpoint có dạng `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, hoặc hostname theo jurisdiction hiện trên dashboard. Bỏ phần đường dẫn tên bucket nếu có.
4. Nhập ba giá trị này vào Render ở bước dưới. Secret Access Key chỉ hiện khi tạo token.

Ảnh cũ vẫn nằm tại các key đã upload. Payload đọc và ghi ảnh qua S3 ở phía máy chủ, rồi phục vụ ảnh qua `/api/media/file/...` trên cùng website. [Hướng dẫn tạo token R2](https://developers.cloudflare.com/r2/api/tokens/)

## 3. Deploy bằng Blueprint

1. Mở [Render Dashboard](https://dashboard.render.com/), chọn **New → Blueprint** rồi kết nối GitHub với repo `Long77118/giasithanhcong`.
2. Chọn branch **`codex/render-staging`** và đường dẫn **`render.yaml`**. Kiểm tra preview tạo đúng một service `giasithanhcong-staging`, gói **Free**, region **Singapore**.
3. Nhập `SQL_HOST`, `SQL_PASSWORD`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` trực tiếp trong Render. Blueprint tự tạo `PAYLOAD_SECRET` để ký phiên đăng nhập. Ứng dụng tự lấy địa chỉ HTTPS từ `RENDER_EXTERNAL_URL`.
4. Bấm **Deploy Blueprint**. Mở **Events/Logs** của service và đợi trạng thái **Live**. Dùng URL hiển thị trên dashboard, vì Render có thể thêm hậu tố nếu tên đã được dùng.

Các bản cập nhật sau dùng **Manual Deploy → Deploy latest commit** sau khi GitHub Actions chạy xong. Nhánh này cũng có thể xuất hiện một check preview của hệ thống Workers cũ. Xem kết quả **Verify Node and Cloudflare staging → Verify Render build, admin and private S3 storage** để xác nhận bản Node.

Nếu muốn tạo thủ công, chọn **New → Web Service → Git Provider**, repo và branch ở trên, runtime **Node**, region **Singapore**, gói **Free**. Sao chép `buildCommand`, `startCommand`, `healthCheckPath`, và các biến trong [render.yaml](../render.yaml). Tạo `PAYLOAD_SECRET` ngẫu nhiên dài ít nhất 32 ký tự trong Render. Render tự cấp `PORT`. Giữ `QUOTE_TRUSTED_PROXY_TOKEN` trống cho tới khi có proxy đáng tin cậy ký IP, để form dùng hạn mức chung qua PostgreSQL.

## 4. Kiểm tra trên URL Render

1. Mở trang chủ, sản phẩm và blog. Mở vài ảnh cũ và kiểm tra chúng tải qua `/api/media/file/...`. Kiểm tra `/robots.txt` có `Disallow: /` và header `X-Robots-Tag` có `noindex`.
2. Mở `/admin` và đăng nhập bằng tài khoản admin đã nhập vào Neon. Mở trang sửa một sản phẩm staging và ghi lại tên cũ.
3. Đổi tên, lưu, rồi mở trang sản phẩm ở tab khác. Xác nhận tên mới hiện ngay. Đổi lại tên cũ và lưu.
4. Trong **Thư viện ảnh**, upload một ảnh thử và điền Alt. Mở ảnh qua URL website, kiểm tra object mới trong R2. Thử gắn ảnh vào sản phẩm rồi hoàn tác sản phẩm trước khi xóa ảnh thử.

Render Free ngủ sau 15 phút không có truy cập. Lần mở lại có thể mất khoảng một phút. [Giới hạn Render Free](https://render.com/docs/free#spinning-down-on-idle)
