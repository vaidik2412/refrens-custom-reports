'use client';

import { CSSProperties } from 'react';

interface PillProps {
  label: string;
  value?: string;
  onRemove?: () => void;
  variant?: 'default' | 'brand';
}

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: 'var(--radius-pill)',
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '-0.25px',
  whiteSpace: 'nowrap',
};

const variants = {
  default: {
    background: 'var(--color-bg-alt)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  },
  brand: {
    background: 'var(--color-chip-bg)',
    color: 'var(--color-chip-text)',
    border: '1px solid var(--color-chip-border)',
  },
};

const removeBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  padding: 0,
  color: 'inherit',
  opacity: 0.6,
  display: 'flex',
  alignItems: 'center',
};

export default function Pill({ label, value, onRemove, variant = 'default' }: PillProps) {
  return (
    <span style={{ ...pillStyle, ...variants[variant] }}>
      <span>
        {label}
        {value && (
          <span style={{ opacity: 0.7 }}>
            : {value}
          </span>
        )}
      </span>
      {onRemove && (
        <button style={removeBtnStyle} onClick={onRemove} aria-label={`Remove ${label}`}>
          &#x2715;
        </button>
      )}
    </span>
  );
}
