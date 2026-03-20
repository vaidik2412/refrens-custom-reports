'use client';

import { CSSProperties } from 'react';

interface PillProps {
  label: string;
  value?: string;
  onRemove?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'brand';
}

const pillBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '32px',
  padding: '4px 12px',
  borderRadius: 'var(--radius-pill)',
  fontSize: '13px',
  fontWeight: 500,
  lineHeight: '20px',
  letterSpacing: '-0.25px',
  whiteSpace: 'nowrap',
};

const pillVariants: Record<NonNullable<PillProps['variant']>, CSSProperties> = {
  default: {
    background: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-strong)',
  },
  brand: {
    background: 'var(--color-chip-bg)',
    color: 'var(--color-chip-text)',
    border: '1px solid var(--color-chip-border)',
  },
};

const valueStyle: CSSProperties = {
  opacity: 0.76,
  fontWeight: 400,
};

const removeButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
  height: '18px',
  border: 'none',
  borderRadius: '999px',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '13px',
  lineHeight: 1,
  opacity: 0.64,
  padding: 0,
  transition: 'background-color 0.16s ease, opacity 0.16s ease',
};

export default function Pill({ label, value, onRemove, variant = 'default' }: PillProps) {
  return (
    <span style={{ ...pillBaseStyle, ...pillVariants[variant] }}>
      <span>
        {label}
        {value ? <span style={valueStyle}>: {value}</span> : null}
      </span>
      {onRemove ? (
        <button
          type="button"
          style={removeButtonStyle}
          onClick={onRemove}
          onMouseEnter={(event) => {
            event.currentTarget.style.opacity = '1';
            event.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.opacity = '0.64';
            event.currentTarget.style.background = 'transparent';
          }}
          aria-label={`Remove ${label}`}
        >
          &#x2715;
        </button>
      ) : null}
    </span>
  );
}
