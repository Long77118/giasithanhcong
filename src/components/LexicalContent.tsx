import React from 'react';
import type {
  LexicalElementNode,
  LexicalLinkNode,
  LexicalNode,
  LexicalTextNode,
} from '@/lib/lexical';

function renderFormattedText(node: LexicalTextNode, key: string): React.ReactNode {
  const fmt = typeof node.format === 'number' ? node.format : 0;
  let content: React.ReactNode = node.text;
  if (fmt & 16) {
    content = (
      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900">
        {content}
      </code>
    );
  }
  if (fmt & 1) {
    content = <strong className="font-semibold text-slate-900">{content}</strong>;
  }
  if (fmt & 2) {
    content = <em>{content}</em>;
  }
  if (fmt & 8) {
    content = <u className="underline underline-offset-2">{content}</u>;
  }
  return <React.Fragment key={key}>{content}</React.Fragment>;
}

function renderLexicalNode(node: LexicalNode, key: string): React.ReactNode {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'text') {
    return renderFormattedText(node as LexicalTextNode, key);
  }

  if (node.type === 'linebreak') {
    return <br key={key} />;
  }

  const children = Array.isArray((node as LexicalElementNode).children)
    ? (node as LexicalElementNode).children!.map((child, i) =>
        renderLexicalNode(child, `${key}-${i}`),
      )
    : null;

  if (node.type === 'heading') {
    const tag = (node as LexicalElementNode).tag;
    if (tag === 'h2') {
      return (
        <h2
          key={key}
          className="mt-8 mb-3 font-display text-2xl font-semibold tracking-tight text-slate-900"
        >
          {children}
        </h2>
      );
    }
    if (tag === 'h3') {
      return (
        <h3
          key={key}
          className="mt-6 mb-2 font-display text-xl font-semibold text-slate-900"
        >
          {children}
        </h3>
      );
    }
    return (
      <h4 key={key} className="mt-5 mb-2 font-display text-lg font-semibold text-slate-900">
        {children}
      </h4>
    );
  }

  if (node.type === 'list') {
    const listType = (node as LexicalElementNode).listType;
    if (listType === 'number') {
      return (
        <ol key={key} className="my-4 list-decimal space-y-2 pl-6 leading-relaxed text-slate-700">
          {children}
        </ol>
      );
    }
    return (
      <ul key={key} className="my-4 list-disc space-y-2 pl-6 leading-relaxed text-slate-700">
        {children}
      </ul>
    );
  }

  if (node.type === 'listitem') {
    return (
      <li key={key} className="leading-relaxed">
        {children}
      </li>
    );
  }

  if (node.type === 'quote') {
    return (
      <blockquote
        key={key}
        className="my-5 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 italic text-slate-700"
      >
        {children}
      </blockquote>
    );
  }

  if (node.type === 'link' || node.type === 'autolink') {
    const rawUrl =
      (node as LexicalLinkNode).fields?.url || (node as LexicalLinkNode).url || '#';
    const safeHref =
      rawUrl.startsWith('/') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? rawUrl
        : '#';
    const newTab = Boolean((node as LexicalLinkNode).fields?.newTab);
    return (
      <a
        key={key}
        href={safeHref}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className="font-medium text-[#0C2340] underline decoration-[#0C2340]/40 underline-offset-4 hover:text-[#B45309] hover:decoration-[#B45309]"
      >
        {children}
      </a>
    );
  }

  if (node.type === 'paragraph') {
    return (
      <p key={key} className="my-3.5 text-[16px] leading-7 text-slate-700">
        {children}
      </p>
    );
  }

  return <div key={key}>{children}</div>;
}

export function LexicalContent({ data }: { data: unknown }) {
  if (!data || typeof data !== 'object') return null;
  const root = (data as { root?: { children?: LexicalNode[] } }).root;
  if (!root || !Array.isArray(root.children) || root.children.length === 0) {
    return null;
  }

  return (
    <div className="max-w-none">
      {root.children.map((node, index) => renderLexicalNode(node, `node-${index}`))}
    </div>
  );
}
