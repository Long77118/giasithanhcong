import React from 'react';
import type { DefaultNodeTypes, SerializedLinkNode, SerializedAutoLinkNode } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { RichText, type JSXConverter, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import { asRecord, publicDocumentLink, richTextImage, safeRichTextHref } from '@/lib/rich-text';
import type { ArticleHeading } from '@/lib/article-content';
import './article-body.css';

const linkConverter: JSXConverter<SerializedLinkNode | SerializedAutoLinkNode> = ({ node, nodesToJSX }) => {
  const children = nodesToJSX({ nodes: node.children });
  const href = node.fields?.linkType === 'internal'
    ? publicDocumentLink(node.fields.doc)?.href
    : safeRichTextHref(node.fields?.url ?? (node as { url?: string }).url);
  if (!href) return <>{children}</>;
  return <a href={href} target={node.fields?.newTab ? '_blank' : undefined} rel={node.fields?.newTab ? 'noopener noreferrer' : undefined}>{children}</a>;
};

function articleConverters(headings: readonly ArticleHeading[]): ReturnType<JSXConvertersFunction<DefaultNodeTypes>> {
  const byIndex = new Map(headings.map((heading) => [heading.index, heading]));
  return {
    heading: ({ node, childIndex, parent, nodesToJSX }) => {
      const heading = parent.type === 'root' ? byIndex.get(childIndex) : undefined;
      // The page title is the only H1. Keep legacy heading levels at most one step apart.
      const preceding = asRecord(parent)?.children;
      const firstHeading = parent.type === 'root' && Array.isArray(preceding)
        ? preceding.findIndex((value) => asRecord(value)?.type === 'heading') : -1;
      const hasSection = firstHeading >= 0 && firstHeading < childIndex;
      const Tag = node.tag === 'h1' || node.tag === 'h2' || !hasSection ? 'h2' : 'h3';
      return <Tag id={heading?.id}>
        {nodesToJSX({ nodes: node.children })}
        {heading && <a className="article-heading-anchor" href={`#${heading.id}`} aria-label="Liên kết tới mục này">#</a>}
      </Tag>;
    },
    table: ({ node, nodesToJSX }) => (
      <div className="article-table-scroll" role="region" aria-label="Bảng trong bài viết, có thể cuộn ngang" tabIndex={0}>
        <table><tbody>{nodesToJSX({ nodes: node.children })}</tbody></table>
      </div>
    ),
    tablecell: ({ node, nodesToJSX }) => {
      const Tag = node.headerState ? 'th' : 'td';
      const scope = node.headerState === 1 ? 'col' : node.headerState === 2 ? 'row' : undefined;
      return <Tag colSpan={node.colSpan} rowSpan={node.rowSpan} scope={scope}>{nodesToJSX({ nodes: node.children })}</Tag>;
    },
  };
}

const createConverters = (headingTag?: 'h3', hideUnavailable = false, headings?: readonly ArticleHeading[]): JSXConvertersFunction<DefaultNodeTypes> => ({ defaultConverters }) => ({
  ...defaultConverters,
  link: linkConverter,
  autolink: linkConverter,
  ...(headingTag ? { heading: ({ node, nodesToJSX }) => React.createElement(headingTag, { style: node.format ? { textAlign: node.format } : undefined }, nodesToJSX({ nodes: node.children })) } satisfies Partial<ReturnType<JSXConvertersFunction<DefaultNodeTypes>>> : {}),
  ...(headings ? articleConverters(headings) : {}),
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

type LexicalContentProps = { data: unknown; hideUnavailable?: boolean } & (
  { variant?: undefined; headingTag?: 'h3' }
  | { variant: 'article'; headings: readonly ArticleHeading[]; headingTag?: never }
);

export function LexicalContent(props: LexicalContentProps) {
  const { data, headingTag, hideUnavailable = false } = props;
  const root = asRecord(asRecord(data)?.root);
  if (!root || !Array.isArray(root.children) || !root.children.length) return null;
  const headings = props.variant === 'article' ? props.headings : undefined;
  return <RichText className={headings ? 'lexical-content article-body' : 'lexical-content max-w-none'}
    converters={createConverters(headingTag, hideUnavailable, headings)} data={data as SerializedEditorState} />;
}
