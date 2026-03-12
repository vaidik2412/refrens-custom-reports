'use client';

import { CSSProperties } from 'react';
import { BILL_TYPE_OPTIONS } from '@/lib/constants';

interface BillTypeStepProps {
  value: string | null;
  onChange: (billType: string) => void;
}

const selectStyle: CSSProperties = {
  padding: '6px 10px',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 'var(--radius-input)',
  background: '#FFFFFF',
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
        e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(0,0,0,0.15)';
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
