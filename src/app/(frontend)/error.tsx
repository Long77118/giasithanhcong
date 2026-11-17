'use client';

import React from 'react';
import Link from 'next/link';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-xs font-semibold tracking-wide text-slate-500">
        Sự cố tải dữ liệu
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-[#0C2340]">
        Không thể tải trang vào lúc này
      </h1>
      <p className="mt-3 text-base text-slate-600">
        Đã xảy ra lỗi tạm thời khi kết nối hệ thống dữ liệu. Vui lòng thử tải lại hoặc quay về danh mục sản phẩm.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] rounded-lg bg-[#0C2340] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163861]"
        >
          Thử tải lại
        </button>
        <Link
          href="/san-pham"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Xem danh sách sản phẩm
        </Link>
      </div>
    </div>
  );
}
