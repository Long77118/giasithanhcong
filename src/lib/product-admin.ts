import { randomBytes } from 'node:crypto';
import type { TextareaFieldValidation } from 'payload';
import type { GenerateTitle } from '@payloadcms/plugin-seo/types';

export const validateProductShortDescription: TextareaFieldValidation = (value, { previousValue }) => {
  if (!value?.trim()) return 'Hãy nhập vài câu giới thiệu sản phẩm.';
  if (value.length <= 200 || (typeof previousValue === 'string' && previousValue.length > 200)) return true;
  return 'Mô tả ngắn tối đa 200 ký tự. Hãy chuyển phần chi tiết sang tab Nội dung.';
};

export function duplicateProductSKU(value: unknown): string {
  const base = String(value ?? '').trim().slice(0, 120) || 'SP';
  return `${base}-ban-sao-${randomBytes(6).toString('hex')}`;
}

export const generateSiteSeoTitle: GenerateTitle = async ({ doc, req }) => {
  const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: false, req, select: { brandName: true } });
  const brand = settings.brandName?.trim() || 'Website';
  const name = (typeof doc?.name === 'string' && doc.name.trim()) || (typeof doc?.title === 'string' && doc.title.trim());
  return name ? `${name} | ${brand}` : brand;
};
