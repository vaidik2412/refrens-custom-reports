'use client';

import { CSSProperties } from 'react';
import { BILL_TYPE_OPTIONS } from '@/lib/constants';

interface BillTypeStepProps {
  value: string | null;
  onChange: (billType: string) => void;
}

const selectStyle: CSSProperties = {
  minHeight: 'var(--height-input)',
  padding: '0 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
  outline: 'none',
  minWidth: '220px',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
  transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
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
        e.target.style.borderColor = 'var(--color-border-input-focus)';
        e.target.style.boxShadow = 'var(--shadow-focus)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--color-border-input)';
        e.target.style.boxShadow = '0 1px 2px rgba(20, 28, 39, 0.04)';
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
