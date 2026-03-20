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

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-label)',
  marginBottom: '8px',
  letterSpacing: '-0.25px',
};

const groupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '2px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
};

const optionBaseStyle: CSSProperties = {
  minHeight: '32px',
  padding: '0 14px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  lineHeight: '20px',
  letterSpacing: '-0.25px',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease',
};

export default function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <div>
      {label ? <span style={labelStyle}>{label}</span> : null}
      <div style={groupStyle}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              style={{
                ...optionBaseStyle,
                background: selected ? 'var(--color-cta-primary)' : 'transparent',
                color: selected ? 'var(--color-bg-card)' : 'var(--color-text-secondary)',
                boxShadow: selected ? '0 1px 2px rgba(20, 28, 39, 0.1)' : 'none',
              }}
              onClick={() => onChange(option.value)}
              onMouseEnter={(event) => {
                if (!selected) {
                  event.currentTarget.style.background = 'var(--color-bg-hover)';
                  event.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(event) => {
                if (!selected) {
                  event.currentTarget.style.background = 'transparent';
                  event.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
