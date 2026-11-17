'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface QuoteRequestFormProps {
  productId?: number | null;
  productName?: string | null;
  defaultQuantity?: string;
}

export function QuoteRequestForm({
  productId = null,
  productName = null,
  defaultQuantity = '',
}: QuoteRequestFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [message, setMessage] = useState(
    productName ? `Xin báo giá sỉ sản phẩm: ${productName}` : '',
  );
  // Anti-spam honeypot field (kept visually hidden from human users)
  const [website, setWebsite] = useState('');
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    requestId: number | string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setFormLoadedAt(Date.now());
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setServerError(null);

    try {
      const res = await fetch('/api/bao-gia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productNameSnapshot: productName,
          quantity,
          customerName,
          phone,
          email: email || undefined,
          companyName: companyName || undefined,
          message,
          sourceUrl:
            typeof window !== 'undefined' ? window.location.pathname : undefined,
          website,
          formLoadedAt: formLoadedAt || Date.now() - 2000,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        requestId?: number | string;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!res.ok || !data.ok) {
        setFieldErrors(data.errors ?? {});
        setServerError(
          data.message || 'Không thể gửi yêu cầu báo giá. Vui lòng kiểm tra lại thông tin.',
        );
        return;
      }

      setSuccessInfo({
        requestId: data.requestId ?? '',
        message:
          data.message ||
          'Đã tiếp nhận yêu cầu báo giá thành công.',
      });
      setCustomerName('');
      setPhone('');
      setEmail('');
      setCompanyName('');
      setQuantity(defaultQuantity);
      setMessage(productName ? `Xin báo giá sỉ sản phẩm: ${productName}` : '');
    } catch {
      setServerError('Lỗi kết nối máy chủ. Vui lòng thử lại sau ít phút.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      id="bao-gia"
      className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-[#0C2340] sm:text-2xl">
          Gửi yêu cầu báo giá sỉ
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          {productName
            ? `Sản phẩm đang chọn: ${productName}`
            : 'Điền quy cách, số lượng dự kiến và số điện thoại để nhận bảng giá sỉ theo thùng.'}
        </p>
      </div>

      {successInfo ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                Gửi yêu cầu báo giá thành công
                {successInfo.requestId ? ` (Mã #${successInfo.requestId})` : ''}
              </p>
              <p className="mt-1 text-sm text-emerald-900">{successInfo.message}</p>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                className="mt-4 inline-flex min-h-[40px] items-center rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                Gửi thêm yêu cầu khác
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Anti-spam honeypot field */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="quote-website">Website</label>
            <input
              id="quote-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="quote-customer-name"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Họ và tên <span className="text-red-600">*</span>
              </label>
              <input
                id="quote-customer-name"
                name="customerName"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nguyễn Văn A"
                aria-invalid={Boolean(fieldErrors.customerName)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
              />
              {fieldErrors.customerName && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.customerName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="quote-phone"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Số điện thoại / Zalo <span className="text-red-600">*</span>
              </label>
              <input
                id="quote-phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                aria-invalid={Boolean(fieldErrors.phone)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="quote-quantity"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Số lượng dự kiến <span className="text-red-600">*</span>
              </label>
              <input
                id="quote-quantity"
                name="quantity"
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ví dụ: 10 thùng"
                aria-invalid={Boolean(fieldErrors.quantity)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
              />
              {fieldErrors.quantity && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.quantity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="quote-email"
                className="mb-1.5 block text-sm font-medium text-slate-800"
              >
                Email (tùy chọn)
              </label>
              <input
                id="quote-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="banhang@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="quote-company"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Tên quán / Đơn vị kinh doanh (tùy chọn)
            </label>
            <input
              id="quote-company"
              name="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Cửa hàng cà phê / Nhà hàng / Đại lý"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
            />
          </div>

          <div>
            <label
              htmlFor="quote-message"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Nội dung cần tư vấn / Địa điểm giao hàng <span className="text-red-600">*</span>
            </label>
            <textarea
              id="quote-message"
              name="message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ghi rõ dung tích, loại nắp đi kèm hoặc khu vực nhận hàng..."
              aria-invalid={Boolean(fieldErrors.message)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0C2340] focus:outline-none focus:ring-2 focus:ring-[#0C2340]/15"
            />
            {fieldErrors.message && (
              <p className="mt-1 text-xs text-red-700">{fieldErrors.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#B45309] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309] sm:w-auto"
          >
            <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu báo giá'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
