'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Send, MessageCircle } from 'lucide-react';
import { useQuoteZaloUrl } from './QuoteContactProvider';
import './quote-request.css';

const quoteControlClass = 'quote-control';

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
  const sectionRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const zaloUrl = useQuoteZaloUrl();

  useEffect(() => {
    setFormLoadedAt(Date.now());
    const section = sectionRef.current;
    if (window.location.hash === '#bao-gia' && section && !section.contains(document.activeElement)) {
      section.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if ((fieldErrors.email || fieldErrors.companyName) && moreRef.current) moreRef.current.open = true;
  }, [fieldErrors]);

  useEffect(() => {
    if (!serverError && !successInfo) return;
    const section = sectionRef.current;
    const target = section?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?? section?.querySelector<HTMLElement>('[role="status"], [role="alert"]');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest' });
  }, [fieldErrors, serverError, successInfo]);

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

  const errorFor = (name: string, id: string) => fieldErrors[name]
    ? <p id={id} className="quote-field-error">{fieldErrors[name]}</p> : null;

  return (
    <section ref={sectionRef} id="bao-gia" tabIndex={-1} aria-labelledby="quote-heading" className="quote-request">
      <div className="quote-request-heading">
        <h2 id="quote-heading">Gửi yêu cầu báo giá</h2>
        <p>{productName ? 'Sản phẩm đang chọn: ' + productName : 'Cho bên mình biết sản phẩm và số lượng bạn cần.'}</p>
        {!successInfo && <p className="quote-required-note">Các ô có dấu <span aria-hidden="true">*</span> là bắt buộc.</p>}
      </div>

      {successInfo ? (
        <div role="status" tabIndex={-1} className="quote-success">
          <span className="quote-success-icon"><CheckCircle2 size={30} aria-hidden="true" /></span>
          <h3>Đã nhận yêu cầu</h3>
          {successInfo.requestId && <p className="quote-success-code">Mã yêu cầu #{successInfo.requestId}</p>}
          <p>{successInfo.message}</p>
          <nav aria-label="Sau khi gửi yêu cầu" className="quote-success-actions">
            {zaloUrl && <a className="quote-button quote-button--primary" href={zaloUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden="true" />Nhắn Zalo ngay
            </a>}
            <button type="button" className="quote-button quote-button--secondary" onClick={() => {
              setSuccessInfo(null);
              requestAnimationFrame(() => sectionRef.current?.querySelector<HTMLInputElement>('[name="customerName"]')?.focus());
            }}>Gửi thêm yêu cầu</button>
          </nav>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="quote-fields" aria-busy={submitting}>
          {serverError && <div role="alert" tabIndex={-1} className="quote-form-error">
            <AlertCircle size={20} aria-hidden="true" /><span>{serverError}</span>
          </div>}

          {/* Anti-spam honeypot: retained with the same state and API key. */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="quote-website">Website</label>
            <input id="quote-website" name="website" type="text" tabIndex={-1} autoComplete="off"
              value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className="quote-personal">
            <div className="quote-field">
              <label htmlFor="quote-customer-name">Tên của bạn <span aria-hidden="true">*</span></label>
              <input id="quote-customer-name" name="customerName" type="text" autoComplete="name" required
                value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A"
                aria-invalid={Boolean(fieldErrors.customerName)} aria-describedby={fieldErrors.customerName ? 'quote-customer-name-error' : undefined}
                className={quoteControlClass} />
              {errorFor('customerName', 'quote-customer-name-error')}
            </div>
            <div className="quote-field">
              <label htmlFor="quote-phone">Số điện thoại <span aria-hidden="true">*</span></label>
              <input id="quote-phone" name="phone" type="tel" autoComplete="tel" required
                value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567"
                aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'quote-phone-error' : undefined}
                className={quoteControlClass} />
              {errorFor('phone', 'quote-phone-error')}
            </div>
          </div>

          <div className="quote-needs">
            <div className="quote-field">
              <label htmlFor="quote-message">Bạn cần mua gì? <span aria-hidden="true">*</span></label>
              <textarea id="quote-message" name="message" rows={4} required value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Ví dụ: ly nhựa 500ml, nắp bằng, dùng cho quán cà phê."
                aria-invalid={Boolean(fieldErrors.message)} aria-describedby={fieldErrors.message ? 'quote-message-error' : undefined}
                className={quoteControlClass} />
              {errorFor('message', 'quote-message-error')}
            </div>
            <div className="quote-field">
              <label htmlFor="quote-quantity">Số lượng dự kiến <span aria-hidden="true">*</span></label>
              <input id="quote-quantity" name="quantity" type="text" required value={quantity} onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ví dụ: 10 thùng ly 500ml"
                aria-invalid={Boolean(fieldErrors.quantity)} aria-describedby={fieldErrors.quantity ? 'quote-quantity-error' : undefined}
                className={quoteControlClass} />
              {errorFor('quantity', 'quote-quantity-error')}
            </div>
          </div>

          <details ref={moreRef} className="quote-more">
            <summary>Thông tin thêm, không bắt buộc</summary>
            <div className="quote-more-fields">
              <div className="quote-field">
                <label htmlFor="quote-email">Email</label>
                <input id="quote-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@example.com" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'quote-email-error' : undefined}
                  className={quoteControlClass} />
                {errorFor('email', 'quote-email-error')}
              </div>
              <div className="quote-field">
                <label htmlFor="quote-company">Tên công ty / cửa hàng</label>
                <input id="quote-company" name="companyName" type="text" autoComplete="organization" value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)} placeholder="Tên công ty hoặc cửa hàng của bạn"
                  aria-invalid={Boolean(fieldErrors.companyName)} aria-describedby={fieldErrors.companyName ? 'quote-company-error' : undefined}
                  className={quoteControlClass} />
                {errorFor('companyName', 'quote-company-error')}
              </div>
            </div>
          </details>

          <div className="quote-submit">
            <button type="submit" disabled={submitting} className="quote-button quote-button--primary">
              <Send size={18} aria-hidden="true" /><span>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu báo giá'}</span>
            </button>
            <p>Số điện thoại chỉ dùng để liên hệ báo giá.</p>
          </div>
        </form>
      )}
    </section>
  );
}
