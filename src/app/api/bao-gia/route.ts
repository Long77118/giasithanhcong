import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { getSqlExecutor } from '@/lib/db-transaction';
import { readQuoteJson } from '@/lib/quote-body';
import { getQuoteClient } from '@/lib/quote-client';
import { consumeQuoteSubmission } from '@/lib/quote-rate-limit';
import { resolveQuoteSourceUrl, validateQuoteSubmission } from '@/lib/quote-validation';

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: 'Không có quyền đọc danh sách yêu cầu báo giá.',
    },
    { status: 405 },
  );
}

export async function POST(req: Request) {
  const client = getQuoteClient(req.headers, process.env.QUOTE_TRUSTED_PROXY_TOKEN);
  if (client.kind === 'unverified') {
    return NextResponse.json(
      { ok: false, message: 'Tạm thời chưa thể gửi yêu cầu. Vui lòng thử lại hoặc liên hệ qua Hotline/Zalo.' },
      { status: 503 },
    );
  }

  const body = await readQuoteJson(req);
  if (body.status !== 200) {
    return NextResponse.json(
      {
        ok: false,
        message: body.status === 413
          ? 'Yêu cầu báo giá quá lớn. Vui lòng rút ngắn nội dung và gửi lại.'
          : 'Dữ liệu gửi lên không đúng định dạng JSON.',
      },
      { status: body.status },
    );
  }

  const validation = validateQuoteSubmission(body.data);
  if (!validation.ok || !validation.data) {
    return NextResponse.json(
      {
        ok: false,
        message: validation.message || 'Thông tin yêu cầu chưa hợp lệ.',
        errors: validation.errors ?? {},
      },
      { status: validation.isSpam ? 400 : 422 },
    );
  }

  const input = validation.data;

  try {
    const payload = await getPayload({ config });
    const db = getSqlExecutor('drizzle' in payload.db ? payload.db.drizzle : undefined);
    const rate = await consumeQuoteSubmission(db, client, payload.secret);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: `Đã đạt giới hạn gửi báo giá. Vui lòng thử lại sau ${rate.retryAfterSeconds} giây hoặc liên hệ qua Hotline/Zalo.`,
        },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
      );
    }

    let resolvedProductId: number | undefined;
    let resolvedProductSlug: string | undefined;
    let productNameSnapshot = input.productNameSnapshot || undefined;

    if (input.productId !== null && input.productId !== undefined && input.productId !== '') {
      const numericId = Number(input.productId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const found = await payload.find({
          collection: 'products',
          where: {
            and: [
              { id: { equals: numericId } },
              { status: { equals: 'published' } },
            ],
          },
          limit: 1,
          depth: 0,
          overrideAccess: false,
        });
        const product = found.docs[0];
        if (product) {
          resolvedProductId = product.id;
          resolvedProductSlug = product.slug;
          productNameSnapshot = `${product.name} (${product.sku})`;
        }
      }
    }

    const created = await payload.create({
      collection: 'quote-requests',
      overrideAccess: true,
      data: {
        product: resolvedProductId,
        productNameSnapshot,
        quantity: input.quantity,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email || undefined,
        companyName: input.companyName || undefined,
        message: input.message,
        sourceUrl: resolveQuoteSourceUrl(input.sourceUrl, resolvedProductSlug),
        status: 'new',
      },
    });

    return NextResponse.json(
      {
        ok: true,
        requestId: created.id,
        message:
          'Đã tiếp nhận yêu cầu báo giá thành công. Bộ phận kinh doanh sẽ liên hệ xác nhận quy cách và báo giá chi tiết.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to persist quote request:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Hệ thống đang bận khi lưu yêu cầu. Vui lòng thử lại sau.',
      },
      { status: 500 },
    );
  }
}
