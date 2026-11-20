import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FileText, Inbox, Package, Plus, UsersRound } from 'lucide-react';
import type { AdminViewServerProps } from 'payload';
import { isAdminUser } from '@/collections/access';
import type { QuoteRequest } from '@/payload-types';

const numberFormat = new Intl.NumberFormat('vi-VN');
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
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
  const [products, posts, users, newQuotes, recentQuotes] = await Promise.all([
    payload.count({ collection: 'products', ...context }),
    payload.count({ collection: 'posts', ...context }),
    payload.count({ collection: 'users', ...context }),
    payload.count({ collection: 'quote-requests', where: { status: { equals: 'new' } }, ...context }),
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

  const destinations = [
    { label: 'Sản phẩm', collection: 'products', count: products.totalDocs, icon: Package, action: 'Thêm sản phẩm' },
    { label: 'Bài viết', collection: 'posts', count: posts.totalDocs, icon: FileText, action: 'Viết bài mới' },
    { label: 'Tài khoản quản trị', collection: 'users', count: users.totalDocs, icon: UsersRound, action: 'Thêm tài khoản' },
  ];

  return (
    <main className="workspace-dashboard" id="workspace-main">
      <header className="workspace-dashboard__header">
        <div>
          <h1>Tổng quan</h1>
          <p>Quản lý danh mục, nội dung và yêu cầu báo giá.</p>
        </div>
        <Link className="workspace-website-link" href="/" target="_blank" rel="noopener noreferrer">
          Xem website <ArrowUpRight size={16} aria-hidden />
        </Link>
      </header>

      <div className="workspace-dashboard__top">
        <section className="workspace-spotlight" aria-labelledby="workspace-quote-count">
          <div className="workspace-spotlight__title">
            <Inbox size={19} aria-hidden />
            <h2 id="workspace-quote-count">Yêu cầu báo giá mới</h2>
          </div>
          <div className="workspace-spotlight__count">{numberFormat.format(newQuotes.totalDocs)}</div>
          <Link href={quotesPath + '?where%5Bstatus%5D%5Bequals%5D=new'}>
            Xem yêu cầu mới <ArrowRight size={17} aria-hidden />
          </Link>
        </section>

        <ul className="workspace-metrics" aria-label="Dữ liệu website">
          {destinations.map(({ label, collection, count, icon: Icon }) => (
            <li key={collection}>
              <Link href={`${adminPath}/collections/${collection}`}>
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
            <Link href={quotesPath}>Xem tất cả <ArrowRight size={15} aria-hidden /></Link>
          </div>
          {recentQuotes.docs.length ? (
            <ul className="workspace-recent">
              {recentQuotes.docs.map(quote => (
                <li key={quote.id}>
                  <Link href={`${quotesPath}/${quote.id}`}>
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
              <span className="workspace-tile-icon"><Inbox size={21} aria-hidden /></span>
              <p>Chưa có yêu cầu báo giá.</p>
            </div>
          )}
        </section>

        <section className="workspace-quick" aria-labelledby="workspace-quick-title">
          <div className="workspace-section-heading">
            <h2 id="workspace-quick-title">Tạo nhanh</h2>
          </div>
          <ul>
            {destinations.map(({ collection, action, icon: Icon }) => (
              <li key={collection}>
                <Link href={`${adminPath}/collections/${collection}/create`}>
                  <span className="workspace-tile-icon"><Icon size={17} aria-hidden /></span>
                  <span>{action}</span>
                  <Plus size={16} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
