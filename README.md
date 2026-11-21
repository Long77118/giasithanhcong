# Bao Bì An Phát — Nền tảng Website Giới Thiệu Sản Phẩm Bán Sỉ & Blog

Bản nền tảng (audit-ready) cho website giới thiệu sản phẩm bao bì thực phẩm/đồ uống bán sỉ kết hợp blog tiếng Việt, xây dựng trên **Next.js App Router + TypeScript + Payload CMS v3 + PostgreSQL + Tailwind CSS**.

**Triển khai bản thử Cloudflare Workers + Neon + R2:** xem [hướng dẫn từng bước](docs/CLOUDFLARE-STAGING.md). Cấu hình staging giữ noindex và dùng database/ảnh tách riêng.

> **Lưu ý dữ liệu minh họa**: Toàn bộ sản phẩm, bài viết, hình ảnh minh họa và thông tin liên hệ mẫu (hotline, Zalo, địa chỉ) đều là dữ liệu minh họa phục vụ kiểm thử và audit, không sao chép từ bất kỳ đơn vị thực tế nào.

---

## 1. Kiến trúc & Công nghệ chính

- **Framework**: Next.js 16 App Router (`16.4.6`) + TypeScript + React `19.3.1`.
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
│   ├── quote-validation.ts         # Zod schema và kiểm tra chống spam
│   ├── quote-rate-limit.ts         # Hạn mức gửi trong PostgreSQL
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

Sử dụng Node.js `22.23.5` (xem `.node-version`; các phiên bản khác phải thỏa `engines.node`) và Bun `1.4.3`. Lockfile chính thức là `bun.lock`:

```bash
bun install --frozen-lockfile
bun audit
```

Các lệnh `npm run ...` bên dưới chạy bằng Node.js đã chọn. Giữ `--webpack` trong lệnh dev/build để tương thích cấu hình Payload hiện tại.

Các override `dompurify@3.4.18`, `happy-dom@21.0.4`, `esbuild@0.28.2` vá dependency gián tiếp của bộ quản trị/rich text và công cụ migration. Khi nâng Payload cần kiểm tra lại các override, trình soạn thảo, SEO, upload và migrations; không bỏ override khi các phiên bản gián tiếp còn cảnh báo bảo mật. Các SDK Firebase/GenAI và công cụ Express/Vite không được ứng dụng sử dụng đã được loại bỏ.

### Bước 3: Khởi tạo schema PostgreSQL (Migrations)

Chạy migration sử dụng `SQL_ADMIN_USER`:

```bash
npm run db:migrate
```

*(Nếu thay đổi cấu trúc collections/globals trong Payload, tạo migration mới bằng `npm run db:migrate:create` rồi chạy `npm run db:migrate`.)*

Migration `20261117_141030_remove_product_prices` chuyển catalog sang mô hình chỉ liên hệ báo giá và xóa hai cột `price`, `show_price`. Sao lưu database trước khi áp dụng trên dữ liệu đã có. Rollback chỉ tạo lại hai cột; muốn khôi phục giá trị cũ cần dùng bản sao lưu.

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

Website chỉ có vai trò `admin`, có thể có nhiều tài khoản Admin. Chỉ Admin của collection `users` được vào quản trị, tạo/sửa/xóa nội dung, ảnh, tài khoản, cấu hình website, quản lý yêu cầu báo giá và mở khóa tài khoản. Đăng nhập/gia hạn phiên từ vai trò cũ không phải Admin bị từ chối; phiên cũ cũng không có quyền quản trị qua REST/GraphQL. Khách vẫn xem nội dung đã xuất bản, ảnh, thông tin liên hệ public và gửi form báo giá.

Migration `20261117_144020_admin_only` loại `editor` khỏi enum PostgreSQL. Migration giữ nguyên Admin hiện có, không đổi mật khẩu và không tự nâng Editor lên Admin. Nếu database khác còn tài khoản không phải Admin, migration dừng và rollback: cần rà soát, thu hồi các tài khoản đó trước khi chạy lại; chỉ cấp Admin cho người đã được chủ website xác nhận.

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
   - `QuoteRequests` chỉ cho Admin thực hiện `read/update/delete/create` trực tiếp qua Payload REST/GraphQL API (`isAdmin`). `POST /api/bao-gia` nhận tối đa 32 KiB JSON, kiểm tra dữ liệu, bẫy bot và thời gian thao tác trước khi tính hạn mức và lưu.
2. **Chính sách URL tìm kiếm, bộ lọc & phân trang (SEO)**:
   - `/san-pham` và `/blog` trang 1 (không có filter/search): `canonical` trỏ về URL gốc sạch, cho phép index khi `ALLOW_INDEXING="true"`.
   - URL tìm kiếm/lọc/sắp xếp (`?q=...`, `?category=...`, `?sort=...`): trên production gán `robots: noindex, follow` và `canonical` trỏ về đường dẫn danh sách sạch. Áp dụng `sort` cho danh sách sản phẩm và trang danh mục.
   - Trang phân trang hợp lệ (`?page=2+`): gán `robots: noindex, follow` và `canonical` tự trỏ khi không có bộ lọc, sắp xếp hoặc canonical tùy chỉnh. Nếu `page` sai định dạng hoặc vượt tổng số trang sau khi lọc, trả HTTP 404. Trang đầu vẫn có trạng thái rỗng khi không có kết quả.
   - Production cho crawl các URL public, kể cả phân trang/tìm kiếm/lọc/sắp xếp, để bot đọc được metadata noindex/canonical. Không dùng `Disallow` theo các tham số này. Quy tắc này cũng tránh chặn nhầm `q=75` của URL ảnh tối ưu Next.js.
   - Production giữ `Disallow: /admin`, `/admin/*`, `/api/`, nhưng có ngoại lệ `Allow: /api/media/file/` cho file ảnh gốc và `Allow: /_next/image` cho ảnh tối ưu. Giới hạn truy cập API bằng phân quyền backend vẫn giữ nguyên; robots không thay thế phân quyền.
   - Chỉ bật index với `ALLOW_INDEXING="true"` và URL HTTP/HTTPS hợp lệ, không thuộc localhost/loopback hoặc preview `ais-dev-`/`ais-pre-`. `NODE_ENV=development` hoặc `test` luôn tắt index. Domain staging khác phải giữ `ALLOW_INDEXING="false"`.
   - Local/staging tắt index trả `Disallow: /`, không có ngoại lệ Allow cho ảnh và không khai báo Sitemap trong robots; các trang, kể cả URL tham số, giữ `noindex, nofollow`. File `.env` local không được đổi sang chế độ production để kiểm thử.
   - Giữ cơ chế sitemap cho nội dung `published`; production khai báo `${APP_URL}/sitemap.xml` trong robots. Xem [Google: noindex cần được crawler đọc](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
   - Sitemap đọc toàn bộ sản phẩm, danh mục sản phẩm và bài viết đã xuất bản theo từng lô 200 bản ghi, sắp theo ID. Mỗi URL canonical xuất hiện một lần với ngày cập nhật của trang đích.
3. **Structured Data (Schema.org)**:
   - Website dùng mô hình liên hệ nhận báo giá: mọi sản phẩm hiển thị `"Liên hệ"`. Collection sản phẩm và API không có trường nhập/công bố giá; JSON-LD `Product` không tạo `Offer`, giá hoặc trạng thái tồn hàng mặc định.
   - Trường **Thương hiệu sản phẩm** trong CMS là dữ liệu tùy chọn của từng sản phẩm. Khi có giá trị, trang chi tiết hiển thị tên này và khai báo cùng tên trong `Product.brand`. Để trống với sản phẩm chưa xác định được thương hiệu. Migration `20261119_005721_product_brand` bổ sung trường này cho database hiện có.
   - Mọi schema được render qua `src/components/JsonLd.tsx` và `serializeJsonLd`: escape ký tự `<` thành `\u003c` sau `JSON.stringify` để nội dung CMS không đóng thẻ `<script>`. Không nhúng trực tiếp `JSON.stringify` vào HTML. Unit tests kiểm tra chuỗi đóng script độc hại, dữ liệu lồng nhau và tiếng Việt cho cả bốn loại schema.
4. **Cập nhật Cache (On-demand Revalidation)**:
   - Các hook `afterChange` và `afterDelete` trên collections/globals gọi `revalidateTag` và `revalidatePath` qua `src/lib/revalidate.ts` để cập nhật HTML và `sitemap.xml` ngay khi xuất bản, sửa hoặc gỡ nội dung.
5. **Trạng thái liên hệ chưa cấu hình**:
   - `resolveContactConfig` kiểm tra hợp lệ hotline và URL Zalo (`https://zalo.me/...`). Nếu để trống trong `SiteSettings`, giao diện hiển thị `"Hotline chưa cấu hình"` / `"Zalo chưa cấu hình"` thay vì chuyển hướng sang bên thứ ba.
6. **Nội dung blog và mô tả sản phẩm**:
   - `LexicalContent` sử dụng `RichText` chính thức của Payload, kèm converters cho ảnh, liên kết nội bộ và relationship. Giữ định dạng chữ, tiêu đề, danh sách, căn lề, trích dẫn và đường phân cách; không dùng HTML thô từ nội dung CMS.
   - Ảnh chèn giữa bài lấy từ collection `media`, có alt, kích thước, lazy loading và chú thích khi được cấu hình. Ảnh giữ tỷ lệ gốc; `srcSet` chỉ nhận biến thể cùng tỷ lệ để tránh dùng nhầm thumbnail đã cắt.
   - Link nội bộ tới sản phẩm, blog, danh mục sản phẩm và chuyên mục blog được ánh xạ sang URL public. Link theo tài liệu sẽ nhận slug mới khi truy vấn lại; đích bị xóa, chưa populate hoặc chuyển nháp giữ phần chữ và không tạo link `#` giả.
   - Editor chỉ cho liên kết/relationship tới bốn collection nội dung public nói trên; ảnh chỉ chọn từ `media`. Khi chèn ảnh, dùng menu `/` → `Upload`; đặt alt/chú thích tại bản ghi ảnh. Khi chèn/sửa link, chọn `Internal Link` và tài liệu đích.
   - Link tùy chỉnh chỉ nhận đường dẫn nội bộ, fragment, query hoặc giao thức HTTP/HTTPS/mailto/tel hợp lệ. URL nguy hiểm được hiển thị như chữ, không thành link. Xem [tài liệu converter JSX của Payload](https://payloadcms.com/docs/rich-text/converting-jsx).
7. **Cây danh mục sản phẩm và bộ lọc**:
   - Danh mục cha lấy sản phẩm trực tiếp và sản phẩm ở mọi cấp con đã xuất bản, không giới hạn hai cấp hoặc 50 danh mục. Danh sách danh mục được tải theo từng trang 200 bản ghi cho đến hết, với access public và cache tags hiện có.
   - Duyệt cây theo ID và tập `visited`, không đệ quy, tránh lặp vô hạn khi gặp dữ liệu cũ có chu kỳ. Nhánh đi qua một danh mục nháp không được gom vào kết quả của danh mục cha. Sản phẩm nháp vẫn bị loại.
   - Bộ chọn danh mục hiển thị cả các cấp con bằng dấu `—`; giữ đúng lựa chọn khi lọc/chuyển trang. Nút public thiếu cha trong dữ liệu public hoặc nằm trong chu kỳ cũ có nhánh hiển thị dự phòng, không bị lặp trong bộ chọn.
   - Kết hợp phạm vi toàn nhánh với từ khóa/SKU, sắp xếp và phân trang ở truy vấn database. Sắp xếp thêm ID làm tiêu chí phụ để ổn định kết quả khi tên, MOQ hoặc thời gian tạo trùng nhau. Phân trang của trang danh mục giữ tham số `sort`.
   - CMS chặn tự chọn mình, chọn một cấp dưới làm cha hoặc gắn vào nhánh đã có vòng lặp. Có thể bỏ danh mục cha để đưa một mục về cấp gốc.
   - Muốn xóa danh mục sản phẩm, hãy chuyển sản phẩm và danh mục con sang nơi khác trước. Muốn xóa chuyên mục blog, hãy chuyển bài viết sang chuyên mục khác. Quy tắc áp dụng cả nội dung nháp và được PostgreSQL bảo vệ bằng khóa ngoại `ON DELETE RESTRICT`. Chạy migration `20261118_135213_guard_category_references` khi cập nhật một database đang dùng.
8. **Slug và đường dẫn cũ**.
   - Slug sản phẩm, danh mục sản phẩm và bài viết dùng chữ thường `a–z`, chữ số và dấu gạch ngang đơn giữa các từ, tối đa 160 ký tự. Đổi tên hoặc tiêu đề giữ nguyên slug. Để đổi URL, sửa trường **Đường dẫn (Slug)** trong CMS.
   - Mỗi slug đã sử dụng được giữ cho tài liệu gốc. Đường dẫn cũ của nội dung đã xuất bản trả HTTP 308 thẳng tới slug hiện tại, giữ các tham số truy vấn. Canonical mặc định và sitemap dùng slug hiện tại.
   - Chạy `npm run db:migrate` trước khi cập nhật ứng dụng. Migration `20261118_140200_content_slug_history` đăng ký các slug hiện có và bắt đầu lưu lịch sử. URL đã đổi trước thời điểm đó chỉ khôi phục được khi có dữ liệu URL cũ.
9. **Canonical tùy chỉnh**.
   - Trong tab SEO, có thể nhập đường dẫn như `/san-pham/ly-nhua-pet` hoặc URL tuyệt đối cùng origin với `APP_URL`. Đích là một trang công khai trên website, dùng URL sạch, bỏ tham số và fragment. Để trống nếu trang là phiên bản chính.
   - Canonical trong HTML và sitemap dùng chung cách chọn đích. Nếu đích đổi slug, hệ thống dùng URL hiện tại. Trang trùng chỉ góp URL đích vào sitemap, kể cả khi nhiều trang cùng trỏ đến một đích. Giá trị cũ sai phạm vi, đích không còn công khai và vòng lặp dùng canonical tự thân.
10. **Ảnh Open Graph**.
    - Khi chia sẻ sản phẩm, danh mục sản phẩm hoặc bài viết, ưu tiên ảnh chọn trong tab SEO, sau đó dùng ảnh nội dung (ảnh sản phẩm đầu tiên có URL, ảnh danh mục hoặc ảnh bìa bài viết). Cấu hình **Ảnh Open Graph mặc định** trong **Cấu hình website & Liên hệ** để dùng ảnh dự phòng và ảnh chia sẻ của các trang tổng quan.
    - Metadata dùng URL ảnh gốc, kèm alt và kích thước thật khi có. Đường dẫn tương đối được chuyển thành URL đầy đủ theo `APP_URL`, còn URL HTTP/HTTPS tuyệt đối giữ máy chủ ảnh.

---

### Giới hạn gửi form báo giá qua proxy

- Chạy migration `20261119_015000_quote_rate_limits` trước khi triển khai bản cập nhật. Các instance cần dùng chung database và `PAYLOAD_SECRET` để tính chung hạn mức 5 lượt gửi hợp lệ mỗi IP trong 10 phút trượt. PostgreSQL chỉ lưu khóa băm có khóa bí mật và thời điểm gửi. Tiến trình dọn bản ghi hết hạn khi bắt đầu tính hạn mức và mỗi phút khi vẫn chạy.
- Khi triển khai qua reverse proxy do mình quản lý, đặt `QUOTE_TRUSTED_PROXY_TOKEN` bằng một bí mật ngẫu nhiên ít nhất 32 ký tự ở ứng dụng và cấu hình proxy để **ghi đè** `X-Quote-Proxy-Token` bằng bí mật đó và `X-Quote-Client-IP` bằng một IP khách đã xác minh. Với Nginx trực tiếp nhận khách, IP là `$remote_addr`. Nếu Nginx đứng sau CDN/load balancer, cấu hình xác minh proxy trước khi dùng địa chỉ đã khôi phục. Giới hạn body 32 KiB ở proxy cho đường dẫn `/api/bao-gia`.
- Khi đã bật bí mật, yêu cầu thiếu xác thực proxy hoặc IP hợp lệ trả 503. Header `X-Forwarded-For` và `X-Real-IP` do client gửi bị bỏ qua. Khi để trống bí mật, app dùng hạn mức chung 60 lượt hợp lệ mỗi 10 phút để chạy local hoặc khi chưa cấu hình proxy.
- Khách vượt hạn mức nhận HTTP 429 và `Retry-After`. Lỗi nhập dữ liệu giữ thông báo theo trường và chưa tính vào hạn mức.

## 6. Trạng thái bàn giao & giới hạn hiện tại

### Nội dung trang chi tiết sản phẩm

Chạy migration `20261121_034654_product_detail_content` bằng `npm run db:migrate` trước khi khởi động bản cập nhật. Migration chỉ thêm trường/bảng; dữ liệu sản phẩm cũ được giữ lại. `availability` mặc định là **Còn hàng**; hãy xác nhận tình trạng thực tế hoặc để trống trong CMS để ẩn nhãn.

Trong **Sản phẩm bán sỉ**, có thể thêm Ưu điểm, Ứng dụng, FAQ, video YouTube, tài liệu PDF và Bài viết liên quan. Đánh dấu tối đa 4 dòng Thông số kỹ thuật là **Hiện ở nhãn nhìn nhanh**. Những khối chưa có dữ liệu sẽ được ẩn. Khi không chọn sản phẩm liên quan đã xuất bản, trang lấy tối đa 4 sản phẩm khác cùng danh mục; bài viết chỉ lấy từ danh sách được chọn và đã xuất bản.

**Tài liệu PDF** là collection upload riêng, công khai để khách tải catalog/bảng giá. Node lưu trong `documents/` (đã Git ignore); Workers dùng adapter và bucket R2 hiện có với prefix `documents`. Media tiếp tục chỉ nhận ảnh. Không tải tài liệu nội bộ/bí mật vào thư viện công khai này.

Video chỉ nhận URL YouTube hợp lệ, hiển thị ảnh thu nhỏ trước và chỉ nạp iframe `youtube-nocookie.com` khi khách bấm; không tự phát. JSON-LD có Product, BreadcrumbList và VideoObject theo dữ liệu thật, không tạo giá/Offer/đánh giá. Chưa có trường ngày tải video nên không tự suy ra `uploadDate` từ ngày tạo sản phẩm.

Các commit của nâng cấp này không thay đổi `force-dynamic`, cache lâu dài, hạ tầng hoặc quy tắc phân quyền hiện có. Form báo giá cũ được giữ nguyên hành vi.

### Đã hoàn thiện
- Next.js App Router + Payload CMS v3 + PostgreSQL migrations & idempotent seed.
- Đầy đủ các trang: `/`, `/san-pham`, `/danh-muc/[slug]`, `/san-pham/[slug]`, `/blog`, `/blog/[slug]`, `/gioi-thieu`, `/lien-he`, `/admin`, `/sitemap.xml`, `/robots.txt`, `404`.
- Bộ lọc tìm kiếm theo từ khóa/SKU, lọc danh mục, sắp xếp và phân trang hoạt động thực tế.
- Form yêu cầu báo giá có validate phía server, chống spam cơ bản, lưu PostgreSQL và ẩn danh sách yêu cầu với khách.
- Unit tests cho SEO, validation, rate limit, contact fallback và slug tiếng Việt.

### Giới hạn hiện tại (giai đoạn nền tảng audit)
- File media tải lên qua Payload Admin hiện lưu tại thư mục cục bộ `media/` (khi triển khai Cloud Run nhiều replica hoặc stateless container cần gắn object storage như GCS/S3 adapter).
- Chưa tích hợp gửi email thông báo tự động (SMTP/Resend) khi có yêu cầu báo giá mới; quản trị viên theo dõi trực tiếp trong Payload Admin mục **Yêu cầu báo giá**.
