import React from 'react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm font-semibold tabular-nums text-[#B45309]">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[#0C2340] sm:text-4xl">
        Không tìm thấy nội dung yêu cầu
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600">
        Đường dẫn bạn truy cập không tồn tại, đã được thay đổi hoặc nội dung đang ở trạng thái chưa xuất bản.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-[#0C2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163861]"
        >
          Về trang chủ
        </Link>
        <Link
          href="/san-pham"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    </div>
  );
}
