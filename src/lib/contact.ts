export interface SiteContactInput {
  brandName?: string | null;
  tagline?: string | null;
  hotline?: string | null;
  zaloUrl?: string | null;
  email?: string | null;
  address?: string | null;
  workingHours?: string | null;
  sampleNotice?: string | null;
}

export interface ResolvedContactConfig {
  brandName: string;
  tagline: string;
  hotline: string | null;
  telHref: string | null;
  isHotlineConfigured: boolean;
  zaloUrl: string | null;
  isZaloConfigured: boolean;
  email: string | null;
  address: string | null;
  workingHours: string | null;
  sampleNotice: string;
}

export function normalizeVietnamesePhoneHref(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.length < 8) return null;
  return `tel:${cleaned}`;
}

export function normalizeZaloUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    const allowedHosts = ['zalo.me', 'www.zalo.me', 'chat.zalo.me'];
    if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function resolveContactConfig(
  input?: SiteContactInput | null,
): ResolvedContactConfig {
  const hotline = input?.hotline?.trim() || null;
  const telHref = normalizeVietnamesePhoneHref(hotline);
  const zaloUrl = normalizeZaloUrl(input?.zaloUrl);

  return {
    brandName: input?.brandName?.trim() || 'Bao Bì An Phát',
    tagline:
      input?.tagline?.trim() ||
      'Nhà cung cấp sỉ ly, chai, hũ, hộp thực phẩm và bao bì dùng một lần.',
    hotline: telHref ? hotline : null,
    telHref,
    isHotlineConfigured: Boolean(telHref && hotline),
    zaloUrl,
    isZaloConfigured: Boolean(zaloUrl),
    email: input?.email?.trim() || null,
    address: input?.address?.trim() || null,
    workingHours: input?.workingHours?.trim() || null,
    sampleNotice:
      input?.sampleNotice?.trim() ||
      'Nội dung, hình ảnh và thông tin liên hệ trên trang là dữ liệu minh họa phục vụ kiểm thử nền tảng.',
  };
}
