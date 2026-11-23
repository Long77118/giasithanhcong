import type { DefaultServerCellComponentProps } from 'payload';
import type { QuoteRequest } from '@/payload-types';
import { isWaitingQuote, quoteReceivedTime, quoteStages } from '@/lib/admin-quotes';
import { QuoteRowActions } from './QuoteRowActions';

export function QuoteCustomerCell({ cellData, rowData, payload, link, linkURL }: DefaultServerCellComponentProps) {
  const href = linkURL ?? `${payload.config.routes.admin}/collections/quote-requests/${encodeURIComponent(String(rowData.id))}`;
  return link
    ? <a className="admin-quote-customer" href={href}>{cellData}</a>
    : <strong>{cellData}</strong>;
}

export function QuoteProductCell({ cellData, rowData }: DefaultServerCellComponentProps) {
  const { product } = rowData as QuoteRequest;
  const linkedName = typeof product === 'object' ? product?.name : product ? `Sản phẩm #${product}` : null;
  return <span className="admin-quote-product">{cellData || linkedName || '—'}</span>;
}

export function QuoteStatusCell({ rowData }: DefaultServerCellComponentProps) {
  const quote = rowData as QuoteRequest;
  return (
    <div className="admin-quote-status">
      <span className="workspace-status" data-status={quote.status}>
        {quoteStages.find(stage => stage.value === quote.status)?.label}
      </span>
      {isWaitingQuote(quote.status, quote.createdAt, Date.now()) &&
        <span className="admin-quote-waiting">Chờ lâu</span>}
    </div>
  );
}

export function QuoteDateCell({ rowData }: DefaultServerCellComponentProps) {
  const { createdAt } = rowData as QuoteRequest;
  const time = quoteReceivedTime(createdAt, Date.now());
  if (!time) return <span>—</span>;
  return <time dateTime={createdAt} title={time.exact}>{time.value}<span className="admin-quote-sr-only">, {time.exact}</span></time>;
}

export function QuoteActionsCell({ rowData, payload }: DefaultServerCellComponentProps) {
  const { id, phone, message, status } = rowData as QuoteRequest;
  const endpoint = `${payload.config.routes.api}/quote-requests/${id}/advance-status`;
  return <QuoteRowActions phone={phone} message={message} status={status} endpoint={endpoint} />;
}
