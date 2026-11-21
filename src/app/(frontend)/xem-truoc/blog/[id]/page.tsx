import type { Metadata } from 'next';
import { PostDetail } from '@/components/PostDetail';
import { PreviewBanner } from '@/components/PreviewBanner';
import { requirePreviewPost } from '@/lib/preview-server';
import { getSiteSettingsCached } from '@/lib/queries';
import { getSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requirePreviewPost((await params).id);
  return {
    title: 'Xem trước bài viết',
    robots: { index: false, follow: false },
    alternates: null,
    openGraph: null,
  };
}

export default async function PostPreviewPage({ params }: Props) {
  const post = await requirePreviewPost((await params).id);
  const { contact } = await getSiteSettingsCached();
  return (
    <>
      <PreviewBanner collection="posts" id={post.id} status={post.status} />
      <PostDetail post={post} contact={contact} siteUrl={getSiteUrl()} preview />
    </>
  );
}
