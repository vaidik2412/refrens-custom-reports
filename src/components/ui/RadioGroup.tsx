'use client';

import { CSSProperties } from 'react';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

const groupStyle: CSSProperties = {
  display: 'flex',
  gap: '0',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 'var(--radius-input)',
  overflow: 'hidden',
};

const optionStyle: CSSProperties = {
  padding: '8px 20px',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '-0.25px',
  cursor: 'pointer',
  border: 'none',
  transition: 'background 0.15s, color 0.15s',
  whiteSpace: 'nowrap',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-label)',
  marginBottom: '6px',
  letterSpacing: '-0.25px',
};

export default function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <div style={groupStyle}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            style={{
              ...optionStyle,
              background: value === opt.value ? 'var(--color-cta-primary)' : '#FFFFFF',
              color: value === opt.value ? '#FFFFFF' : 'var(--color-text-primary)',
            }}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
