'use client';

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui';
import type { CSSProperties } from 'react';
import type { TextFieldClientProps } from 'payload';

export default function SeasonalDateField({ field, path: fieldPath, readOnly }: TextFieldClientProps) {
  const { disabled, errorMessage, path, setValue, showError, value } = useField<string | null>({ potentiallyStalePath: fieldPath });
  const id = `field-${path.replace(/\./g, '__')}`;

  return (
    <div className={`field-type text${showError ? ' error' : ''}`} style={{ '--field-width': field.admin?.width } as CSSProperties}>
      <FieldLabel label={field.label} path={path} htmlFor={id} />
      <input
        id={id}
        name={path}
        type="date"
        lang="vi"
        value={value ?? ''}
        disabled={disabled || readOnly}
        onChange={event => setValue(event.currentTarget.value || null)}
        aria-invalid={showError || undefined}
        aria-describedby={`${id}-hint${showError ? ` ${id}-error` : ''}`}
      />
      <div id={`${id}-hint`}><FieldDescription description={field.admin?.description} path={path} /></div>
      {showError && <p id={`${id}-error`} role="alert" className="field-description">{errorMessage}</p>}
    </div>
  );
}
