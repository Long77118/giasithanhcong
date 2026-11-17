# Bao Bì An Phát — Nền tảng Website Giới Thiệu Sản Phẩm Bán Sỉ & Blog

Bản nền tảng (audit-ready) cho website giới thiệu sản phẩm bao bì thực phẩm/đồ uống bán sỉ kết hợp blog tiếng Việt, xây dựng trên **Next.js App Router + TypeScript + Payload CMS v3 + PostgreSQL + Tailwind CSS**.

> **Lưu ý dữ liệu minh họa**: Toàn bộ sản phẩm, bài viết, hình ảnh minh họa và thông tin liên hệ mẫu (hotline, Zalo, địa chỉ) đều là dữ liệu minh họa phục vụ kiểm thử và audit, không sao chép từ bất kỳ đơn vị thực tế nào.

---

## 1. Kiến trúc & Công nghệ chính

- **Framework**: Next.js 15 App Router (`15.4.11`) + TypeScript + React 19.
- **CMS tích hợp**: Payload CMS v3 (`3.93.0`) chạy chung tiến trình Next.js (`/admin`, `/api/*`), truy vấn phía server qua **Payload Local API** (`getPayload({ config })`).
- **Cơ sở dữ liệu**: PostgreSQL qua `@payloadcms/db-postgres` (Drizzle + `node-postgres` Pool cấu hình theo Object Method với các biến `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`).
- **Rich Text & SEO**: `@payloadcms/richtext-lexical` + `@payloadcms/plugin-seo`.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Validation**: `zod` cho kiểm tra dữ liệu đầu vào form báo giá phía server.

---

## 2. Cấu trúc dự án

```text
src/
├── app/
│   ├── (frontend)/                 # Toàn bộ giao diện public (SSR / Dynamic)
│   │   ├── page.tsx                # Trang chủ (/)
│   │   ├── san-pham/page.tsx       # Danh sách sản phẩm + tìm kiếm/lọc/phân trang
│   │   ├── san-pham/[slug]/page.tsx# Chi tiết sản phẩm, thông số, gallery, form báo giá
│   │   ├── danh-muc/[slug]/page.tsx# Trang danh mục sản phẩm
│   │   ├── blog/page.tsx           # Danh sách bài viết
│   │   ├── blog/[slug]/page.tsx    # Chi tiết bài viết & sản phẩm liên quan
│   │   ├── gioi-thieu/page.tsx     # Trang giới thiệu & năng lực cung ứng
│   │   ├── lien-he/page.tsx        # Trang liên hệ & yêu cầu báo giá
│   │   ├── loading.tsx / error.tsx / not-found.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── (payload)/                  # Trang quản trị Payload CMS & REST/GraphQL API
│   │   ├── admin/[[...segments]]/
│   │   ├── api/[...slug]/
│   │   ├── api/graphql/
│   │   └── layout.tsx
│   ├── api/bao-gia/route.ts        # API tiếp nhận yêu cầu báo giá (Zod + chống spam)
│   ├── api/health/route.ts         # Health check
│   ├── robots.ts                   # /robots.txt (chặn index môi trường thử nghiệm)
│   └── sitemap.ts                  # /sitemap.xml (chỉ URL canonical đã xuất bản)
├── collections/                    # Payload Collections + Access Control
│   ├── access.ts                   # Quy tắc phân quyền & chặn dữ liệu nháp
│   ├── Users.ts
│   ├── Media.ts
│   ├── ProductCategories.ts
│   ├── Products.ts
│   ├── PostCategories.ts
│   ├── Posts.ts
│   └── QuoteRequests.ts
├── globals/
│   └── SiteSettings.ts             # Cấu hình thương hiệu, hotline, Zalo, SEO mặc định
├── components/                     # UI components tái sử dụng
├── lib/
│   ├── contact.ts                  # Chuẩn hóa hotline/Zalo & xử lý trạng thái chưa cấu hình
│   ├── db-config.ts                # Cấu hình PostgreSQL Pool (Object Method)
│   ├── env.ts                      # Đọc PAYLOAD_SECRET từ biến môi trường
│   ├── lexical.ts                  # Helper tạo dữ liệu Lexical
│   ├── queries.ts                  # Payload Local API + unstable_cache
│   ├── quote-validation.ts         # Zod schema + sliding-window rate limiter
│   ├── revalidate.ts               # On-demand cache invalidation khi CMS thay đổi
│   ├── seo.ts                      # Canonical, staging noindex, JSON-LD builders
│   ├── slug.ts                     # Chuẩn hóa slug tiếng Việt & parse phân trang
│   └── core.test.ts                # Unit tests (node:test)
├── migrations/                     # Payload PostgreSQL migrations
└── seed/
    ├── data.ts                     # Bộ dữ liệu mẫu (4 danh mục, 12 SP + 1 draft, 4 bài viết)
    └── run.ts                      # Script seed idempotent
```

---

## 3. Hướng dẫn cài đặt & khởi tạo PostgreSQL

### Bước 1: Chuẩn bị biến môi trường

Sao chép `.env.example` thành `.env` (file `.env` đã nằm trong `.gitignore`, **không commit bí mật vào repository**):

```bash
cp .env.example .env
```

Điền đầy đủ các biến trong `.env`:
- `APP_URL` & `NEXT_PUBLIC_SITE_URL`: URL gốc của ứng dụng (ví dụ `http://localhost:3000`).
- `ALLOW_INDEXING`: đặt `"false"` ở môi trường local/staging để ngăn công cụ tìm kiếm index; chỉ đặt `"true"` trên domain production chính thức.
- `PAYLOAD_SECRET`: chuỗi ngẫu nhiên tối thiểu 32 ký tự (`openssl rand -hex 32`).
- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`: thông tin user ứng dụng PostgreSQL (quyền đọc/ghi dữ liệu).
- `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`: thông tin user quản trị PostgreSQL (chỉ dùng khi chạy migrations).

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Khởi tạo schema PostgreSQL (Migrations)

Chạy migration sử dụng `SQL_ADMIN_USER`:

```bash
npm run db:migrate
```

*(Nếu thay đổi cấu trúc collections/globals trong Payload, tạo migration mới bằng `npm run db:migrate:create` rồi chạy `npm run db:migrate`.)*

### Bước 4: Nạp dữ liệu mẫu an toàn (Idempotent Seed)

```bash
npm run db:seed
```

Script `src/seed/run.ts` có thể chạy lặp lại nhiều lần một cách an toàn (tự kiểm tra theo `slug`, `alt`, cập nhật hoặc bỏ qua bản ghi đã tồn tại mà không gây trùng lặp).

Dữ liệu seed gồm:
- `SiteSettings`: thông tin thương hiệu và kênh liên hệ minh họa.
- `4 ProductCategories` đã xuất bản (`ly-coc-dung-mot-lan`, `hop-khay-thuc-pham`, `chai-hu-nhua-pet`, `tui-bao-bi-giay`).
- `12 Products` đã xuất bản + `1 Product` ở trạng thái `draft` (`hop-ba-mia-2-ngan-noi-bo-draft`) để kiểm thử cơ chế chặn truy cập bản nháp.
- `2 PostCategories` và `4 Posts` đã xuất bản.

---

## 4. Tạo tài khoản Admin đầu tiên & chạy Local

### Tạo tài khoản quản trị Payload

Do repository không lưu mật khẩu hay tài khoản mặc định:
1. Chạy server local bằng `npm run dev`.
2. Truy cập `http://localhost:3000/admin`.
3. Khi bảng `users` chưa có tài khoản nào, Payload tự động hiển thị màn hình **Create First User** để bạn tạo tài khoản `admin` đầu tiên.
4. Sau khi đã có admin đầu tiên, mọi thao tác truy cập `/admin` hoặc tạo thêm tài khoản đều yêu cầu đăng nhập.

### Các lệnh vận hành chính

```bash
# Chạy môi trường phát triển (cổng 3000)
npm run dev

# Kiểm tra TypeScript & unit tests
npm run typecheck
npm run test

# Build production
npm run build

# Khởi chạy production server (sau khi build)
npm run start
```

---

## 5. Các quyết định kỹ thuật & SEO chính

1. **Bảo mật dữ liệu nháp & thông tin khách hàng**:
   - Collections `Products`, `ProductCategories`, `Posts`, `PostCategories` áp dụng `access.read` chỉ trả về `status = 'published'` cho người dùng chưa đăng nhập, và trang Next.js trả về `404` (`notFound()`) nếu slug không tồn tại hoặc đang ở trạng thái `draft`.
   - `QuoteRequests` chặn hoàn toàn `read/update/delete/create` trực tiếp qua Payload REST API đối với khách chưa đăng nhập (`isAuthenticated`). Khách hàng gửi yêu cầu qua `POST /api/bao-gia`, nơi kiểm tra `zod` schema, trường bẫy bot (honeypot `website`), thời gian thao tác tối thiểu và giới hạn tần suất theo IP (5 yêu cầu / 10 phút) trước khi ghi bằng Payload Local API.
2. **Chính sách URL tìm kiếm, bộ lọc & phân trang (SEO)**:
   - `/san-pham` và `/blog` trang 1 (không có filter/search): `canonical` trỏ về URL gốc sạch, cho phép index khi `ALLOW_INDEXING="true"`.
   - URL tìm kiếm/lọc (`?q=...`, `?category=...`): gán `robots: noindex, follow` và `canonical` trỏ về đường dẫn danh sách sạch (`/san-pham` hoặc `/blog`) để tránh phân mảnh ngân sách crawl.
   - Phân trang (`?page=2+`): gán `robots: noindex, follow` và `canonical` tự trỏ về trang phân trang tương ứng.
   - `sitemap.xml` chỉ liệt kê các URL canonical ở trạng thái `published`; `robots.txt` chặn toàn bộ bot (`Disallow: /`) khi `ALLOW_INDEXING !== "true"` hoặc chạy trên domain thử nghiệm/localhost.
3. **Structured Data (Schema.org)**:
   - Chỉ phát sinh JSON-LD (`Organization`, `BreadcrumbList`, `Product`, `BlogPosting`) phản ánh đúng dữ liệu thực hiển thị. Khi sản phẩm chưa công bố giá (`showPrice = false`), giao diện hiển thị `"Liên hệ báo giá"` và JSON-LD `Product` không tạo `Offer` giả.
4. **Cập nhật Cache (On-demand Revalidation)**:
   - Các hook `afterChange` và `afterDelete` trên collections/globals gọi `revalidateTag` và `revalidatePath` qua `src/lib/revalidate.ts` để cập nhật HTML và `sitemap.xml` ngay khi xuất bản, sửa hoặc gỡ nội dung.
5. **Trạng thái liên hệ chưa cấu hình**:
   - `resolveContactConfig` kiểm tra hợp lệ hotline và URL Zalo (`https://zalo.me/...`). Nếu để trống trong `SiteSettings`, giao diện hiển thị `"Hotline chưa cấu hình"` / `"Zalo chưa cấu hình"` thay vì chuyển hướng sang bên thứ ba.

---

## 6. Trạng thái bàn giao & giới hạn hiện tại

### Đã hoàn thiện
- Next.js App Router + Payload CMS v3 + PostgreSQL migrations & idempotent seed.
- Đầy đủ các trang: `/`, `/san-pham`, `/danh-muc/[slug]`, `/san-pham/[slug]`, `/blog`, `/blog/[slug]`, `/gioi-thieu`, `/lien-he`, `/admin`, `/sitemap.xml`, `/robots.txt`, `404`.
- Bộ lọc tìm kiếm theo từ khóa/SKU, lọc danh mục, sắp xếp và phân trang hoạt động thực tế.
- Form yêu cầu báo giá có validate phía server, chống spam cơ bản, lưu PostgreSQL và ẩn danh sách yêu cầu với khách.
- Unit tests cho SEO, validation, rate limit, contact fallback và slug tiếng Việt.

### Giới hạn hiện tại (giai đoạn nền tảng audit)
- Rate limit ở `/api/bao-gia` hiện lưu trong bộ nhớ tiến trình Node.js (phù hợp chạy đơn instance/audit; khi scale đa container cần thay bằng Redis/Upstash).
- File media tải lên qua Payload Admin hiện lưu tại thư mục cục bộ `media/` (khi triển khai Cloud Run nhiều replica hoặc stateless container cần gắn object storage như GCS/S3 adapter).
- Chưa tích hợp gửi email thông báo tự động (SMTP/Resend) khi có yêu cầu báo giá mới; quản trị viên theo dõi trực tiếp trong Payload Admin mục **Yêu cầu báo giá**.
