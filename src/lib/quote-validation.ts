import { z } from 'zod';

const vietnamesePhoneRegex = /^(?:\+?84|0)(?:\d){8,10}$/;

export const quoteRequestSchema = z.object({
  productId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  productNameSnapshot: z.string().trim().max(200).optional().nullable(),
  quantity: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập số lượng dự kiến.')
    .max(100, 'Số lượng không được vượt quá 100 ký tự.'),
  customerName: z
    .string()
    .trim()
    .min(2, 'Vui lòng nhập họ tên hoặc tên người liên hệ (tối thiểu 2 ký tự).')
    .max(120, 'Họ tên quá dài.'),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s.-]/g, ''))
    .refine((val) => vietnamesePhoneRegex.test(val), {
      message: 'Số điện thoại không hợp lệ (ví dụ: 0901234567 hoặc +84901234567).',
    }),
  email: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.length === 0 || z.string().email().safeParse(val).success,
      { message: 'Địa chỉ email không đúng định dạng.' },
    ),
  companyName: z.string().trim().max(160).optional().nullable(),
  message: z
    .string()
    .trim()
    .min(5, 'Vui lòng nhập nội dung yêu cầu tối thiểu 5 ký tự.')
    .max(2000, 'Nội dung yêu cầu không vượt quá 2000 ký tự.'),
  sourceUrl: z.string().trim().max(300).optional().nullable(),
  // Anti-spam honeypot field: must stay empty
  website: z.string().optional().default(''),
  // Optional client render timestamp for basic bot speed check (>= 800ms)
  formLoadedAt: z.number().optional(),
});

export type QuoteRequestValidated = z.infer<typeof quoteRequestSchema>;

export interface QuoteValidationResult {
  ok: boolean;
  isSpam?: boolean;
  data?: QuoteRequestValidated;
  errors?: Record<string, string>;
  message?: string;
}

export function validateQuoteSubmission(
  rawBody: unknown,
  nowMs: number = Date.now(),
): QuoteValidationResult {
  const parsed = quoteRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] || 'form');
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
    return {
      ok: false,
      errors,
      message: 'Vui lòng kiểm tra lại các trường thông tin bắt buộc.',
    };
  }

  // Honeypot triggered
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return {
      ok: false,
      isSpam: true,
      message: 'Yêu cầu không hợp lệ.',
    };
  }

  // Too-fast automated submission (< 800ms after mount)
  if (
    typeof parsed.data.formLoadedAt === 'number' &&
    Number.isFinite(parsed.data.formLoadedAt) &&
    nowMs - parsed.data.formLoadedAt < 800
  ) {
    return {
      ok: false,
      isSpam: true,
      message: 'Thao tác quá nhanh, vui lòng thử lại sau giây lát.',
    };
  }

  return {
    ok: true,
    data: parsed.data,
  };
}

export interface RateLimitEntry {
  timestamps: number[];
}

export function checkSlidingWindowRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  options: { maxRequests?: number; windowMs?: number; nowMs?: number } = {},
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const maxRequests = options.maxRequests ?? 5;
  const windowMs = options.windowMs ?? 10 * 60 * 1000;
  const nowMs = options.nowMs ?? Date.now();

  const existing = store.get(key)?.timestamps ?? [];
  const valid = existing.filter((ts) => nowMs - ts < windowMs);

  if (valid.length >= maxRequests) {
    const oldest = valid[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (nowMs - oldest)) / 1000),
    );
    store.set(key, { timestamps: valid });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  valid.push(nowMs);
  store.set(key, { timestamps: valid });

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - valid.length),
    retryAfterSeconds: 0,
  };
}
