import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock3, FileText, ImageOff, Inbox, Package, Search } from 'lucide-react';
import type { AdminViewServerProps } from 'payload';
import { isAdminUser } from '@/collections/access';
import { dashboardListHref, getDashboardFilters, QUOTE_WAIT_HOURS } from '@/lib/admin-dashboard';
import type { QuoteRequest } from '@/payload-types';

const numberFormat = new Intl.NumberFormat('vi-VN');
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const quoteStatuses: Record<QuoteRequest['status'], string> = {
  new: 'Mới tiếp nhận',
  contacted: 'Đã liên hệ',
  quoted: 'Đã gửi báo giá',
  closed: 'Hoàn tất',
};

export default async function WorkspaceDashboard({ initPageResult: { req } }: AdminViewServerProps) {
  if (!isAdminUser(req.user)) return null;

  const { payload } = req;
  const adminPath = payload.config.routes.admin;
  const quotesPath = `${adminPath}/collections/quote-requests`;
  const context = { req, overrideAccess: false } as const;
  const filters = getDashboardFilters(new Date());
  const newQuotesHref = dashboardListHref(adminPath, 'quote-requests', filters.newQuotes);
  const [newQuotes, waitingQuotes, productDrafts, postDrafts, missingImages, missingSeoDescription, recentQuotes] = await Promise.all([
    payload.count({ collection: 'quote-requests', where: filters.newQuotes, ...context }),
    payload.count({ collection: 'quote-requests', where: filters.waitingQuotes, ...context }),
    payload.count({ collection: 'products', where: filters.drafts, ...context }),
    payload.count({ collection: 'posts', where: filters.drafts, ...context }),
    payload.count({ collection: 'products', where: filters.missingImages, ...context }),
    payload.count({ collection: 'products', where: filters.missingSeoDescription, ...context }),
    payload.find({
      collection: 'quote-requests',
      sort: ['-createdAt', '-id'],
      limit: 5,
      depth: 0,
      pagination: false,
      select: { customerName: true, createdAt: true, status: true },
      ...context,
    }),
  ]);

  const tasks = [
    { label: 'Sản phẩm đang nháp', href: dashboardListHref(adminPath, 'products', filters.drafts), count: productDrafts.totalDocs, icon: Package },
    { label: 'Bài viết đang nháp', href: dashboardListHref(adminPath, 'posts', filters.drafts), count: postDrafts.totalDocs, icon: FileText },
    { label: 'Sản phẩm thiếu ảnh', href: dashboardListHref(adminPath, 'products', filters.missingImages), count: missingImages.totalDocs, icon: ImageOff },
    { label: 'Sản phẩm thiếu mô tả SEO', href: dashboardListHref(adminPath, 'products', filters.missingSeoDescription), count: missingSeoDescription.totalDocs, icon: Search },
  ];
  const shortcuts = [
    { label: 'Thêm sản phẩm', href: `${adminPath}/collections/products/create`, icon: Package },
    { label: 'Viết bài', href: `${adminPath}/collections/posts/create`, icon: FileText },
    { label: 'Xem yêu cầu mới', href: newQuotesHref, icon: Inbox },
    { label: 'Xem website', href: '/', icon: ArrowUpRight, external: true },
  ];

  return (
    <main className="workspace-dashboard" id="workspace-main">
      <header className="workspace-dashboard__header">
        <div>
          <h1>Việc hôm nay</h1>
          <p>Ưu tiên báo giá cần phản hồi và nội dung đang chờ hoàn thiện.</p>
        </div>
      </header>

      <div className="workspace-dashboard__top">
        <section className="workspace-spotlight" aria-labelledby="workspace-quote-count">
          <div className="workspace-spotlight__title">
            <Inbox size={19} aria-hidden />
            <h2 id="workspace-quote-count">Yêu cầu báo giá mới</h2>
          </div>
          <div className="workspace-spotlight__count">{numberFormat.format(newQuotes.totalDocs)}</div>
          <Link href={newQuotesHref} prefetch={false}>
            Xem yêu cầu mới <ArrowRight size={17} aria-hidden />
          </Link>
          <Link className="workspace-quote-wait" href={dashboardListHref(adminPath, 'quote-requests', filters.waitingQuotes)} prefetch={false}>
            <Clock3 size={17} aria-hidden />
            <span>Chờ quá {QUOTE_WAIT_HOURS} giờ</span>
            <strong>{numberFormat.format(waitingQuotes.totalDocs)}</strong>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </section>

        <ul className="workspace-metrics" aria-label="Nội dung cần hoàn thiện">
          {tasks.map(({ label, href, count, icon: Icon }) => (
            <li key={href}>
              <Link href={href} prefetch={false}>
                <span className="workspace-tile-icon"><Icon size={19} aria-hidden /></span>
                <span className="workspace-metrics__label">{label}</span>
                <strong>{numberFormat.format(count)}</strong>
                <ArrowUpRight className="workspace-metrics__arrow" size={16} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="workspace-dashboard__details">
        <section className="workspace-worklist" aria-labelledby="workspace-recent-title">
          <div className="workspace-section-heading">
            <h2 id="workspace-recent-title">Báo giá gần đây</h2>
            <Link href={quotesPath} prefetch={false}>Xem tất cả <ArrowRight size={15} aria-hidden /></Link>
          </div>
          {recentQuotes.docs.length ? (
            <ul className="workspace-recent">
              {recentQuotes.docs.map(quote => (
                <li key={quote.id}>
                  <Link href={`${quotesPath}/${quote.id}`} prefetch={false}>
                    <span className="workspace-recent__name">
                      <strong>{quote.customerName}</strong>
                      <time dateTime={quote.createdAt}>{dateFormat.format(new Date(quote.createdAt))}</time>
                    </span>
                    <span className="workspace-status" data-status={quote.status}>{quoteStatuses[quote.status]}</span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="workspace-empty">
              <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" fill="none">
                <circle cx="24" cy="24" r="23" fill="var(--workspace-lavender)" />
                <path d="m13 22 11 4 11-4v13l-11 4-11-4V22Zm0 0-4-5 12-4 3 5 3-5 12 4-4 5m-11 4v13" stroke="var(--workspace-sticker-ink)" strokeWidth="2" strokeLinejoin="round" />
                <path d="M24 6v3m-8 0 2 2m14-2-2 2" stroke="var(--workspace-sticker-ink)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div><strong>Chưa có yêu cầu báo giá.</strong><p>Khi khách gửi yêu cầu, bạn sẽ thấy ở đây.</p></div>
            </div>
          )}
        </section>

        <section className="workspace-quick" aria-labelledby="workspace-quick-title">
          <div className="workspace-section-heading">
            <h2 id="workspace-quick-title">Thao tác nhanh</h2>
          </div>
          <ul>
            {shortcuts.map(({ href, label, icon: Icon, external }) => (
              <li key={href}>
                <Link href={href} prefetch={false} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
                  <span className="workspace-tile-icon"><Icon size={17} aria-hidden /></span>
                  <span>{label}</span>
                  {!external && <ArrowRight size={16} aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
