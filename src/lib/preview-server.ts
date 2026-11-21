import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';
import { canPreview, parsePreviewID } from './preview';
import { getPostForPreview, getProductForPreview } from './queries';

// React cache only deduplicates within this request; no authenticated data is cached across users.
const getPreviewUser = cache(async () => {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user || !canPreview(user)) notFound();
  return user;
});

export const requirePreviewProduct = cache(async (value: string) => {
  const id = parsePreviewID(value);
  if (id === null) notFound();
  const product = await getProductForPreview(id, await getPreviewUser());
  if (!product) notFound();
  return product;
});

export const requirePreviewPost = cache(async (value: string) => {
  const id = parsePreviewID(value);
  if (id === null) notFound();
  const post = await getPostForPreview(id, await getPreviewUser());
  if (!post) notFound();
  return post;
});
