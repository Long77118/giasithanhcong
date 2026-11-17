import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Safely triggers Next.js on-demand cache revalidation when Payload content
 * is published, updated, or deleted. No-ops gracefully when executed inside
 * standalone CLI scripts (migrations, seed).
 */
export function safeRevalidateTags(tags: string[], paths: string[] = []) {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // Ignore outside Next.js server context (e.g. CLI seed/migrate scripts)
    }
  }
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // Ignore outside Next.js server context
    }
  }
}
