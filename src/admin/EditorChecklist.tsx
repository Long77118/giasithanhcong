'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useConfig, useFormFields, useFormInitializing } from '@payloadcms/ui';
import { Check, Circle, LoaderCircle, Sparkles } from 'lucide-react';
import { postChecklist, productChecklist, selectedImage } from '@/lib/editor-completeness';

type ChecklistItem = ReturnType<typeof productChecklist>[number];
type LookupResult = { key: string; alts: Map<string, string>; state: 'ready' | 'error' };
const emptyAlts = new Map<string, string>();
const mediaBatchSize = 40;

function useImageAlts(values: unknown[]) {
  const { config } = useConfig();
  const apiPath = config.routes.api;
  const idsKey = [...new Set(values.flatMap(value => {
    const image = selectedImage(value);
    return image && image.alt === undefined ? [image.id] : [];
  }))].sort().join(',');
  const [result, setResult] = useState<LookupResult>();

  useEffect(() => {
    if (!idsKey) return;
    const controller = new AbortController();
    const ids = idsKey.split(',');
    async function readAlts() {
      const alts = new Map<string, string>();
      try {
        for (let start = 0; start < ids.length; start += mediaBatchSize) {
          const batch = ids.slice(start, start + mediaBatchSize);
          const query = new URLSearchParams({
            'where[id][in]': batch.join(','), limit: String(batch.length), depth: '0',
            'select[id]': 'true', 'select[alt]': 'true',
          });
          const response = await fetch(`${apiPath}/media?${query}`, { signal: controller.signal, cache: 'no-store' });
          if (!response.ok) throw new Error('Không đọc được thư viện ảnh.');
          const { docs } = await response.json() as { docs: { id: number; alt?: string }[] };
          for (const { id, alt } of docs) alts.set(String(id), alt ?? '');
        }
        if (!controller.signal.aborted) setResult({ key: idsKey, alts, state: 'ready' });
      } catch {
        if (!controller.signal.aborted) setResult({ key: idsKey, alts: emptyAlts, state: 'error' });
      }
    }
    void readAlts();
    return () => controller.abort();
  }, [apiPath, idsKey]);

  if (!idsKey) return { state: 'ready' as const, alts: emptyAlts };
  return result?.key === idsKey ? result : { state: 'checking' as const, alts: emptyAlts };
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  const titleId = useId();
  const done = items.filter(item => item.state === 'done').length;
  const percentage = Math.floor(100 * done / items.length);
  const unsettled = items.some(item => item.state === 'checking');
  const initializing = useFormInitializing();
  const previous = useRef<number>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (initializing || unsettled) return;
    if (percentage === 100 && previous.current !== null && previous.current < 100) {
      setCelebrate(true);
    }
    previous.current = percentage;
  }, [initializing, percentage, unsettled]);

  return (
    <section className="admin-checklist" aria-labelledby={titleId}>
      <div className="admin-checklist-header">
        <h2 id={titleId}><Sparkles size={17} aria-hidden /> Độ hoàn thiện</h2>
        <strong data-celebrate={celebrate || undefined}>{percentage}%</strong>
      </div>
      <progress aria-label="Độ hoàn thiện" value={done} max={items.length} />
      <p className="admin-checklist-summary" aria-live="polite">
        {done}/{items.length} mục hoàn thành{percentage === 100 ? ' · Đủ các mục kiểm tra' : ''}
      </p>
      <ul>
        {items.map(({ id, label, hint, state, completedHint }) => {
          const Icon = state === 'done' ? Check : state === 'checking' ? LoaderCircle : Circle;
          return (
            <li key={id} data-check={id} data-state={state}>
              <span className="admin-checklist-icon"><Icon size={14} aria-hidden /></span>
              <div>
                <span className="admin-checklist-label">{label}</span>
                <small>{state === 'done' ? completedHint ?? 'Đã hoàn thành' : hint}</small>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProductChecklistField() {
  const fields = useFormFields(([state]) => state);
  const value = (path: string) => fields[path]?.value;
  const imageRows = (fields.images?.rows ?? []).map((_, index) => value(`images.${index}.image`));
  const specs = (fields.specs?.rows ?? []).map((_, index) => ({
    label: value(`specs.${index}.label`), value: value(`specs.${index}.value`),
  }));
  const alts = useImageAlts(imageRows);
  return <Checklist items={productChecklist({
    name: value('name'), sku: value('sku'), category: value('category'),
    shortDescription: value('shortDescription'), imageRows, specs, packagingSpec: value('packagingSpec'),
    meta: { title: value('meta.title'), description: value('meta.description') },
  }, alts)} />;
}

export function PostChecklistField() {
  const fields = useFormFields(([state]) => state);
  const value = (path: string) => fields[path]?.value;
  const coverImage = value('coverImage');
  const alts = useImageAlts([coverImage]);
  return <Checklist items={postChecklist({
    title: value('title'), excerpt: value('excerpt'), category: value('category'),
    coverImage, content: value('content'),
    meta: { title: value('meta.title'), description: value('meta.description') },
  }, alts)} />;
}
