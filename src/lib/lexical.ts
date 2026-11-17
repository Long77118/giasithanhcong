export interface LexicalTextNode {
  [k: string]: unknown;
  type: 'text';
  text: string;
  format?: number;
  detail: number;
  mode: 'normal';
  style: string;
  version: 1;
}

export interface LexicalLinkNode {
  [k: string]: unknown;
  type: 'link';
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  children?: LexicalNode[];
  direction?: 'ltr' | null;
  format?: '';
  indent?: 0;
  version: 1;
}

export interface LexicalElementNode {
  [k: string]: unknown;
  type: string;
  tag?: string;
  listType?: 'bullet' | 'number';
  start?: number;
  value?: number;
  direction?: 'ltr' | null;
  format?: '';
  indent?: 0;
  children?: LexicalNode[];
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  version: number;
}

export type LexicalNode = LexicalTextNode | LexicalLinkNode | LexicalElementNode;

export interface LexicalRoot {
  [k: string]: unknown;
  root: {
    type: 'root';
    format: '';
    indent: 0;
    version: 1;
    direction: 'ltr' | null;
    children: LexicalNode[];
  };
}

export type LexicalBlockSpec =
  | { kind: 'heading'; tag: 'h2' | 'h3'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; listType: 'bullet' | 'number'; items: string[] };

function makeTextNode(text: string): LexicalTextNode {
  return {
    type: 'text',
    text,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  };
}

export function buildLexicalDocument(blocks: LexicalBlockSpec[]): LexicalRoot {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: blocks.map((block) => {
        if (block.kind === 'heading') {
          return {
            type: 'heading',
            tag: block.tag,
            format: '',
            indent: 0,
            direction: 'ltr',
            version: 1,
            children: [makeTextNode(block.text)],
          };
        }
        if (block.kind === 'list') {
          return {
            type: 'list',
            listType: block.listType,
            tag: block.listType === 'number' ? 'ol' : 'ul',
            start: 1,
            format: '',
            indent: 0,
            direction: 'ltr',
            version: 1,
            children: block.items.map((item, idx) => ({
              type: 'listitem',
              value: idx + 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              version: 1,
              children: [makeTextNode(item)],
            })),
          };
        }
        return {
          type: 'paragraph',
          format: '',
          indent: 0,
          direction: 'ltr',
          version: 1,
          children: [makeTextNode(block.text)],
        };
      }),
    },
  };
}
