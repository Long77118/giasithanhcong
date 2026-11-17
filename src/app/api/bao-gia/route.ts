import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import {
  checkSlidingWindowRateLimit,
  validateQuoteSubmission,
  type RateLimitEntry,
} from '@/lib/quote-validation';

declare global {
  var _quoteRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getRateLimitStore() {
  if (!global._quoteRateLimitStore) {
    global._quoteRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return global._quoteRateLimitStore;
}

function extractClientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'local-client';
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message: 'Không có quyền đọc danh sách yêu cầu báo giá.',
    },
    { status: 405 },
  );
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Dữ liệu gửi lên không đúng định dạng JSON.' },
      { status: 400 },
    );
  }

  const clientKey = extractClientKey(req);
  const rateCheck = checkSlidingWindowRateLimit(getRateLimitStore(), clientKey, {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: `Bạn đã gửi quá nhiều yêu cầu liên tiếp. Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây hoặc liên hệ qua Hotline/Zalo.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.retryAfterSeconds),
        },
      },
    );
  }

  const validation = validateQuoteSubmission(rawBody);
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

    let resolvedProductId: number | undefined;
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
        if (found.docs[0]) {
          resolvedProductId = found.docs[0].id;
          productNameSnapshot = `${found.docs[0].name} (${found.docs[0].sku})`;
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
        sourceUrl: input.sourceUrl || undefined,
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
