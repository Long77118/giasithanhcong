# Chạy thử bằng Cloudflare Workers + Neon PostgreSQL + R2

Đây là cấu hình **staging, luôn noindex**, chạy cả website và Payload `/admin`.
Database dùng PostgreSQL, không chuyển sang D1. Hướng dẫn dành cho tài khoản Cloudflare của chủ website; không cần dùng dịch vụ Sites của ChatGPT.

## Tài nguyên cần tạo

| Tài nguyên | Tên đề xuất | Vai trò |
| --- | --- | --- |
| Neon project | `giasithanhcong` | Máy chủ PostgreSQL |
| Neon database/branch thử nghiệm | `giasithanhcong_staging` / `staging` | Dữ liệu thử, tách môi trường chính thức |
| Cloudflare Hyperdrive | `giasithanhcong-staging-db` | Kết nối Workers tới Neon |
| R2 bucket | `giasithanhcong-staging-media` | Ảnh upload từ CMS |
| Worker | `giasithanhcong-staging` | Website, admin và API |

Bundle thử đã đo khoảng 18 MiB chưa nén (4.2 MiB gzip). Theo [giới hạn Cloudflare hiện tại](https://developers.cloudflare.com/workers/platform/limits/), giới hạn bundle là 64 MiB chưa nén cho cả Free/Paid; không kết luận phải nâng gói chỉ vì gzip vượt 3 MiB. Tuy nhiên Free có CPU 10 ms/request, cần kiểm tra SSR/đăng nhập CMS trên URL thật; emulator không chứng minh được giới hạn CPU ở cloud. Repository không tự mua hoặc nâng gói.

## 1. Tạo Neon

1. Đăng ký tại [Neon](https://console.neon.tech/). Có thể dùng tài khoản GitHub.
2. Tạo project `giasithanhcong`, chọn PostgreSQL 18 và khu vực gần khách truy cập. Dùng khu vực châu Á nếu có trong danh sách.
3. Tạo branch `staging`, database `giasithanhcong_staging`.
4. Giữ role owner để chạy migrations/import. Tạo role ứng dụng bằng **SQL Editor** trên branch staging, dùng mật khẩu mạnh riêng do bạn tự tạo:

   ```sql
   CREATE ROLE giasithanhcong_app LOGIN PASSWORD 'THAY_BANG_MAT_KHAU_RIENG';
   ```

   Không dùng mật khẩu minh họa trên. Theo [tài liệu Neon](https://neon.com/docs/manage/roles), role tạo qua giao diện Roles mặc định có `neon_superuser`; tạo qua SQL rồi cấp quyền ở bước 2 giúp Worker chỉ có quyền đọc/ghi dữ liệu cần thiết.
5. Mở **Connect**, chọn đúng branch/database/role. **Tắt Connection pooling** để lấy hostname DIRECT. Hyperdrive sẽ đảm nhiệm pooling.
6. Lưu host, database, mật khẩu app và mật khẩu owner trong `.env.staging` ở máy cá nhân, sao chép từ `.env.staging.example`. Không gửi các giá trị này vào chat/GitHub.
7. Đặt `SQL_SSL=true`, `ALLOW_INDEXING=false`, `DEPLOYMENT_STAGE=staging`.

Mật khẩu trong chuỗi kết nối có thể được URL-encode. Khi nhập vào các biến `SQL_PASSWORD` dạng riêng lẻ, dùng mật khẩu gốc từ Neon.

## 2. Chuyển dữ liệu trước khi mở website

Push Git chỉ chuyển code, không chuyển PostgreSQL hoặc thư mục `media/`.

**Để giữ nguyên nội dung hiện tại**, sao lưu database local rồi dùng `pg_dump`/`pg_restore` để nhập vào database staging mới, bỏ owner và ACL của máy local. Giữ nguyên ID và tên file. Chạy migrations còn thiếu bằng role owner:

```sh
node --env-file=.env.staging node_modules/payload/bin.js migrate
```

Không chạy seed trên database đã nhập dữ liệu hiện tại. Nếu muốn một database hoàn toàn mới, chạy migrations và seed riêng, sau đó tạo admin từ một tiến trình Node chạy ở localhost trỏ vào Neon.

**Database phải có ít nhất một admin trước khi mở Worker công khai.** Worker chủ động từ chối khởi tạo nếu chưa có admin, tránh người ngoài chiếm bước tạo tài khoản đầu tiên. Có thể dùng bản sao database hiện tại để giữ tài khoản admin, không cần đổi mật khẩu.

Sau khi import/migrate, chạy trong Neon SQL Editor bằng role owner (đổi tên database/role nếu bạn đã chọn tên khác):

```sql
GRANT CONNECT ON DATABASE giasithanhcong_staging TO giasithanhcong_app;
GRANT USAGE ON SCHEMA public TO giasithanhcong_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO giasithanhcong_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO giasithanhcong_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO giasithanhcong_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO giasithanhcong_app;
```

Migration `20261120_040000_cloudflare_media` bổ sung một cột khóa R2 cho Media; không xóa nội dung.

## 3. Tạo Hyperdrive

1. Cloudflare Dashboard → **Storage & databases → Hyperdrive → Create**.
2. Đặt tên `giasithanhcong-staging-db`.
3. Nhập kết nối Neon **DIRECT**, dùng role `giasithanhcong_app`, không dùng role owner hoặc endpoint `-pooler`.
4. **Tắt query caching** của Hyperdrive cho staging để thay đổi nội dung và quyền quản trị có hiệu lực ngay.
5. Sau khi kết nối thành công, sao chép **Configuration ID** vào `hyperdrive[0].id` trong `wrangler.jsonc`. ID không phải mật khẩu và có thể lưu trong repo.

Worker lấy thông tin DB qua binding `HYPERDRIVE`; không cần đưa mật khẩu Neon vào mã nguồn hoặc các biến public.

## 4. Tạo R2 và chuyển ảnh

1. Cloudflare Dashboard → **R2 Object Storage → Create bucket**.
2. Đặt tên `giasithanhcong-staging-media`, hoặc sửa `bucket_name` tương ứng trong `wrangler.jsonc`.
3. Giữ bucket **private**. Không cần bật `r2.dev`, CORS hay tạo S3 API key cho ứng dụng này.
4. Upload toàn bộ file trong thư mục local `media/` vào gốc bucket, giữ nguyên tên file và cấu trúc. Bao gồm cả các file thumbnail/card/hero đã có. Dùng trang quản lý bucket hoặc Wrangler khi đã đăng nhập.
5. Ảnh mới từ `/admin` sẽ được lưu vào bucket qua binding `MEDIA_BUCKET`. Quyền upload/xóa vẫn chỉ dành cho admin. Ảnh được phục vụ qua `/api/media/file/...` của website.

Ảnh sẵn trong `public/images`, `public/admin-assets` và font đi cùng code; không cần chuyển các thư mục đó vào R2.

## 5. URL và secrets

Sửa `APP_URL` và `NEXT_PUBLIC_SITE_URL` trong `wrangler.jsonc` thành URL thực tế:

```text
https://giasithanhcong-staging.<subdomain-cua-ban>.workers.dev
```

Giữ nguyên `DEPLOY_TARGET=cloudflare`, `DEPLOYMENT_STAGE=staging`, `ALLOW_INDEXING=false`.

Tạo hai chuỗi ngẫu nhiên khác nhau, mỗi chuỗi ít nhất 32 ký tự, bằng công cụ quản lý mật khẩu hoặc `openssl rand -hex 32`:

| Secret trên Worker | Công dụng |
| --- | --- |
| `PAYLOAD_SECRET` | Ký phiên đăng nhập Payload |
| `QUOTE_TRUSTED_PROXY_TOKEN` | Xác thực IP do Worker cung cấp cho form báo giá |

Nhập ở **Worker → Settings → Variables and Secrets**, loại **Secret**. Không đặt secrets trong `wrangler.jsonc`, `.env.example` hoặc biến `NEXT_PUBLIC_*`. Không đưa thông tin owner PostgreSQL lên Worker.

## 6. Build và deploy

Dùng Node 22.23.5 và Bun 1.4.3. Ưu tiên CI Linux/WSL cho OpenNext; Windows native không phải môi trường build được khuyến nghị.

```sh
bun install --frozen-lockfile
bun run test
bun run typecheck
bun run cf:build
bun run cf:check
bun run cf:deploy
```

`cf:check` dừng nếu Hyperdrive ID/URL vẫn là placeholder hoặc staging bị bật index.
Khi dùng CLI lần đầu, đăng nhập qua `bunx wrangler login`; chủ tài khoản tự hoàn tất bước cấp quyền của Cloudflare.

Nếu dùng Cloudflare **Workers Builds** kết nối GitHub:

- Repository: `Long77118/giasithanhcong`, branch `main`.
- Worker name: `giasithanhcong-staging`, khớp `wrangler.jsonc`.
- Install command: `bun install --frozen-lockfile`.
- Build command: `bun run cf:build`.
- Deploy command: `bun run cf:deploy`.
- Đặt phiên bản Node/Bun đúng ở phần cấu hình build.
- Tạo database, nhập dữ liệu/admin, điền Hyperdrive ID, bucket và runtime secrets **trước khi mở URL cho người khác thử**.
- Không đặt `CLOUDFLARE_BUILD=true` vào runtime secrets; cờ này chỉ do lệnh build sử dụng.

## 7. Kiểm tra bản cloud

- `/robots.txt` trả `Disallow: /`; HTML có `noindex`; response có `X-Robots-Tag: noindex, nofollow, noarchive`.
- Trang chủ, tìm kiếm/lọc/phân trang, sản phẩm và blog mở được; URL nháp trả 404.
- Đăng nhập `/admin`, mở trang sửa sản phẩm/bài viết và soạn thảo nội dung.
- Upload ảnh thử, gắn vào sản phẩm/blog, xác nhận file có trong R2 và hiển thị ngoài website.
- Sửa nội dung trong CMS rồi tải lại trang công khai, xác nhận thay đổi có hiệu lực.
- Gửi form báo giá, xem yêu cầu trong admin; kiểm tra rate limit và quyền truy cập API riêng tư.
- Đăng xuất, xác nhận khách không đọc được users hoặc danh sách báo giá.

Chỉ đánh dấu deploy thành công sau các bước trên trên **URL cloud thực tế**. Build/preview local không thay thế việc kiểm tra Neon/R2 thật.

## Phạm vi bản thử

- Bản Workers không dùng Sharp native; ảnh mới được giữ bản gốc trong R2. Các ảnh responsive/thumbnail đã nhập vẫn dùng được; giao diện có fallback về ảnh gốc.
- Next Image ở bản thử phục vụ ảnh gốc, chưa bật dịch vụ Cloudflare Images phát sinh phí. Local Node vẫn tối ưu/resize như trước.
- Query CMS ở Worker staging đọc trực tiếp, không giữ cache nội dung giữa các instance, để sửa admin có hiệu lực ngay. Có thể thiết kế cache phân tán cho bản production sau khi thử ổn định.
- PostgreSQL trên Worker dùng pool ngắn hạn riêng cho từng thao tác; giao dịch giữ cùng client đến khi commit/rollback. Hyperdrive quản lý pool upstream. Điều này tránh chia sẻ socket/promise giữa các request khi Payload cache adapter trong isolate. Driver dùng `node:net` của Workers để tránh lỗi đóng socket của `pg-cloudflare`; timeout kết nối 15 giây, truy vấn 20 giây. Local Node giữ pool hiện tại.
- Đây là noindex, không phải cơ chế giữ kín URL. Muốn chỉ nhóm thử truy cập, cấu hình Cloudflare Access riêng.
- Chưa cấu hình dịch vụ email; dùng tài khoản admin hiện có khi thử. Email khôi phục mật khẩu chưa gửi tới hộp thư thật.

Tài liệu gốc: [Payload trên Workers](https://github.com/payloadcms/payload/tree/v3.93.0/templates/with-cloudflare-d1), [OpenNext](https://opennext.js.org/cloudflare), [Neon với Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/), [Payload R2](https://payloadcms.com/docs/upload/storage-adapters).
