import { parsePublicContentPath, publicContentPath } from './slug';

export const staticCanonicalPaths = ['/', '/san-pham', '/blog', '/gioi-thieu', '/lien-he'] as const;
export type StaticCanonicalPath = typeof staticCanonicalPaths[number];

function isStaticCanonicalPath(path: string): path is StaticCanonicalPath {
  return staticCanonicalPaths.some((staticPath) => staticPath === path);
}

export function normalizeCanonicalPath(value: unknown, siteUrl: string): string | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (!input || /[\\?#\u0000-\u001f\u007f]/.test(input)) return null;
  if (!/^https?:\/\//i.test(input) && (!input.startsWith('/') || input.startsWith('//'))) return null;

  try {
    const site = new URL(siteUrl);
    const url = new URL(input, site);
    if (url.origin !== site.origin || url.username || url.password) return null;
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (isStaticCanonicalPath(path)) return path;
    const route = parsePublicContentPath(path);
    return route ? publicContentPath(route.collection, route.slug) : null;
  } catch {
    return null;
  }
}

export interface CanonicalDocument {
  path: string;
  canonicalUrl?: string | null;
}

export function createCanonicalResolver(
  siteUrl: string,
  findPublishedDocument: (path: string) => Promise<CanonicalDocument | undefined>,
) {
  // A resolver is scoped to one page or sitemap request.
  const resolved = new Map<string, string | null>();

  return async function resolveCanonicalPath(source: CanonicalDocument): Promise<string> {
    if (!source.canonicalUrl) return source.path;
    const visited = new Set<string>();
    let current = source;
    let result: string | null;

    while (true) {
      const cached = resolved.get(current.path);
      if (cached !== undefined || visited.has(current.path)) {
        result = cached ?? null;
        break;
      }
      visited.add(current.path);

      const path = normalizeCanonicalPath(current.canonicalUrl, siteUrl);
      if (!path || path === current.path) {
        result = current.path;
        break;
      }
      if (isStaticCanonicalPath(path)) {
        result = path;
        break;
      }
      const target = await findPublishedDocument(path);
      if (!target || target.path === current.path) {
        result = current.path;
        break;
      }
      current = target;
    }

    // A cycle has no canonical target. Every affected page falls back to itself.
    for (const path of visited) resolved.set(path, result);
    return result ?? source.path;
  };
}
