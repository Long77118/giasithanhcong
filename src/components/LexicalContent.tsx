import React from 'react';
import type { DefaultNodeTypes, SerializedLinkNode, SerializedAutoLinkNode } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { RichText, type JSXConverter, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import { asRecord, publicDocumentLink, richTextImage, safeRichTextHref } from '@/lib/rich-text';

const linkConverter: JSXConverter<SerializedLinkNode | SerializedAutoLinkNode> = ({ node, nodesToJSX }) => {
  const children = nodesToJSX({ nodes: node.children });
  const href = node.fields?.linkType === 'internal'
    ? publicDocumentLink(node.fields.doc)?.href
    : safeRichTextHref(node.fields?.url ?? (node as { url?: string }).url);
  if (!href) return <>{children}</>;
  return <a href={href} target={node.fields?.newTab ? '_blank' : undefined} rel={node.fields?.newTab ? 'noopener noreferrer' : undefined}>{children}</a>;
};

const createConverters = (headingTag?: 'h3', hideUnavailable = false): JSXConvertersFunction<DefaultNodeTypes> => ({ defaultConverters }) => ({
  ...defaultConverters,
  link: linkConverter,
  autolink: linkConverter,
  ...(headingTag ? { heading: ({ node, nodesToJSX }) => React.createElement(headingTag, null, nodesToJSX({ nodes: node.children })) } satisfies Partial<ReturnType<JSXConvertersFunction<DefaultNodeTypes>>> : {}),
  upload: ({ node }) => {
    const image = node.relationTo === 'media' ? richTextImage(node.value, node.fields) : undefined;
    if (!image) return hideUnavailable ? null : <p className="rich-text-unavailable">Ảnh không còn khả dụng.</p>;
    return (
      <figure>
        <img src={image.src} srcSet={image.srcSet} sizes={image.srcSet ? '(max-width: 768px) 100vw, 768px' : undefined} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    );
  },
  relationship: ({ node }) => {
    const link = publicDocumentLink(node);
    return link ? <p><a href={link.href}>{link.label}</a></p> : null;
  },
});

export function LexicalContent({ data, headingTag, hideUnavailable = false }: { data: unknown; headingTag?: 'h3'; hideUnavailable?: boolean }) {
  const root = asRecord(asRecord(data)?.root);
  if (!root || !Array.isArray(root.children) || !root.children.length) return null;
  return <RichText className="lexical-content max-w-none" converters={createConverters(headingTag, hideUnavailable)} data={data as SerializedEditorState} />;
}
