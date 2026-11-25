import { safeRichTextHref } from './rich-text';

const vietnamDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const seasonalAnnouncementMaxLength = 100;

const snowParticles = { light: 26, medium: 44, strong: 64 } as const;
type SnowIntensity = keyof typeof snowParticles;

export interface SeasonalThemeConfig {
  enabled?: boolean | null;
  theme?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  intensity?: string | null;
  snowEnabled?: boolean | null;
  lightsEnabled?: boolean | null;
  decorationsEnabled?: boolean | null;
  scrollEffectsEnabled?: boolean | null;
  announcementEnabled?: boolean | null;
  announcementText?: string | null;
  announcementHref?: string | null;
}

export interface ActiveSeason {
  theme: 'christmas';
  expiresAt: number | null;
  intensity: SnowIntensity;
  snow: boolean;
  lights: boolean;
  decorations: boolean;
  scrollEffects: boolean;
  announcement: { text: string; href?: string } | null;
}

function localDateKey(now: Date): string {
  const parts = Object.fromEntries(vietnamDate.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}`;
}

function endOfVietnameseDay(day: string): number {
  // Vietnam's current civil offset is UTC+07:00. Use the first millisecond after the selected day.
  return Date.parse(`${day}T23:59:59.999+07:00`) + 1;
}

function isOptionalDate(value: unknown): boolean {
  if (value == null || value === '') return true;
  if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getSeasonalScheduleError({ startsOn, endsOn }: Pick<SeasonalThemeConfig, 'startsOn' | 'endsOn'>) {
  if (!isOptionalDate(startsOn)) return { field: 'startsOn', message: 'Chọn ngày bắt đầu hợp lệ.' } as const;
  if (!isOptionalDate(endsOn)) return { field: 'endsOn', message: 'Chọn ngày kết thúc hợp lệ.' } as const;
  if (startsOn && endsOn && startsOn > endsOn) {
    return { field: 'endsOn', message: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.' } as const;
  }
  return null;
}

export function normalizeSeasonalAnnouncementHref(value: unknown): string | undefined {
  const href = safeRichTextHref(value);
  if (href?.startsWith('/')) return href;
  if (!href || !/^https:\/\//i.test(href)) return undefined;
  const url = new URL(href);
  return url.username || url.password ? undefined : href;
}

export function resolveSeasonalTheme(config: SeasonalThemeConfig | null | undefined, now: Date): ActiveSeason | null {
  if (!config || config.enabled !== true || config.theme !== 'christmas' || !Number.isFinite(now.getTime()) || getSeasonalScheduleError(config)) {
    return null;
  }

  const { startsOn, endsOn } = config;
  const today = localDateKey(now);
  if ((startsOn && today < startsOn) || (endsOn && today > endsOn)) return null;

  const text = config.announcementText?.trim();
  return {
    theme: 'christmas',
    expiresAt: endsOn ? endOfVietnameseDay(endsOn) : null,
    intensity: config.intensity === 'medium' || config.intensity === 'strong' ? config.intensity : 'light',
    snow: config.snowEnabled !== false,
    lights: config.lightsEnabled !== false,
    decorations: config.decorationsEnabled !== false,
    scrollEffects: config.scrollEffectsEnabled !== false,
    announcement: config.announcementEnabled && text && text.length <= seasonalAnnouncementMaxLength
      ? { text, href: normalizeSeasonalAnnouncementHref(config.announcementHref) }
      : null,
  };
}

export function getSnowParticleCount(intensity: SnowIntensity, width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0;
  const areaFactor = Math.max(.5, Math.min(1.25, width * height / (1440 * 900)));
  const phoneFactor = width < 640 ? .5 : 1;
  return Math.round(snowParticles[intensity] * areaFactor * phoneFactor);
}

export function getChristmasCountdown(now: Date) {
  if (!Number.isFinite(now.getTime())) return null;
  const deadline = endOfVietnameseDay(`${localDateKey(now).slice(0, 4)}-12-25`);
  const remaining = Math.ceil((deadline - now.getTime()) / 1000);
  if (remaining <= 0) return null;

  return {
    deadline,
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining / 3600) % 24,
    minutes: Math.floor(remaining / 60) % 60,
    seconds: remaining % 60,
  };
}
