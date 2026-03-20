'use client';

import { CSSProperties } from 'react';
import { BILL_TYPE_OPTIONS } from '@/lib/constants';

interface BillTypeStepProps {
  value: string | null;
  onChange: (billType: string) => void;
}

const selectStyle: CSSProperties = {
  padding: '6px 10px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
  outline: 'none',
  minWidth: '200px',
};

export default function BillTypeStep({ value, onChange }: BillTypeStepProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...selectStyle,
        color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--color-cta-primary)';
        e.target.style.boxShadow = 'var(--shadow-focus)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--color-border)';
        e.target.style.boxShadow = 'none';
      }}
    >
      <option value="" disabled>
        Select document type...
      </option>
      {BILL_TYPE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
