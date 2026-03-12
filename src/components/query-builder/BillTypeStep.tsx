'use client';

import { CSSProperties } from 'react';
import { BILL_TYPE_OPTIONS } from '@/lib/constants';

interface BillTypeStepProps {
  value: string | null;
  onChange: (billType: string) => void;
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: '8px',
};

const tileBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: '#FFFFFF',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
  letterSpacing: '-0.25px',
  textAlign: 'center',
};

const selectedStyle: CSSProperties = {
  borderColor: 'var(--color-cta-primary)',
  background: 'rgba(79, 70, 229, 0.04)',
  boxShadow: '0 0 0 3px rgba(79,70,229,0.1)',
  color: 'var(--color-cta-primary)',
};

export default function BillTypeStep({ value, onChange }: BillTypeStepProps) {
  return (
    <div style={gridStyle}>
      {BILL_TYPE_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            style={{
              ...tileBaseStyle,
              ...(isSelected ? selectedStyle : {}),
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-icon-border)';
                (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-alt)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
              }
            }}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
