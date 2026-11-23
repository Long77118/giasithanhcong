'use client';

import { useDocumentInfo, useFormFields, useListQuery } from '@payloadcms/ui';
import { Check } from 'lucide-react';
import { quoteStages } from '@/lib/admin-quotes';

export function QuoteQuickFilters() {
  const { query, refineListData } = useListQuery();
  const choices = [{ value: '', label: 'Tất cả' }, ...quoteStages];
  const whereKeys = Object.keys(query.where ?? {});
  const statusFilter = query.where?.status;
  const currentStatus = whereKeys.length === 1 && statusFilter && !Array.isArray(statusFilter) ? statusFilter.equals : undefined;
  return (
    <div className="admin-quote-filters" role="group" aria-label="Lọc nhanh theo trạng thái">
      {choices.map(({ value, label }) => (
        <button
          type="button"
          key={value}
          aria-pressed={value ? currentStatus === value : whereKeys.length === 0}
          onClick={() => void refineListData({ page: 1, where: value ? { status: { equals: value } } : {} })}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function QuoteStageField() {
  const { id } = useDocumentInfo();
  const status = useFormFields(([fields]) => fields.status?.value);
  const index = quoteStages.findIndex(stage => stage.value === status);
  if (!id || index < 0) return null;
  return (
    <section className="admin-quote-progress" aria-labelledby="admin-quote-progress-title">
      <h2 id="admin-quote-progress-title">Tiến trình báo giá</h2>
      <ol>
        {quoteStages.map((stage, step) => (
          <li key={stage.value} aria-current={step === index ? 'step' : undefined} data-stage={stage.value}>
            <span className="admin-quote-progress-mark" aria-hidden="true">{step < index ? <Check size={16} /> : step + 1}</span>
            {stage.label}
          </li>
        ))}
      </ol>
    </section>
  );
}
