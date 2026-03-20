'use client';

import { CSSProperties } from 'react';

interface BooleanFilterProps {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 'var(--height-input)',
  padding: '0 4px 0 0',
  gap: '12px',
};

const labelStyle: CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  letterSpacing: '-0.25px',
  color: 'var(--color-text-primary)',
};

const stateStyle: CSSProperties = {
  marginLeft: '6px',
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
};

const trackStyle: CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '22px',
  border: 'none',
  borderRadius: '999px',
  padding: 0,
  transition: 'background-color 0.16s ease',
};

const thumbStyle: CSSProperties = {
  position: 'absolute',
  top: '2px',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: 'var(--color-bg-card)',
  boxShadow: 'var(--shadow-toggle-thumb)',
  transition: 'left 0.16s ease',
};

export default function BooleanFilter({ label, value, onChange }: BooleanFilterProps) {
  const isOn = value === true;

  const handleClick = () => {
    if (value === undefined) {
      onChange(true);
    } else if (value === true) {
      onChange(false);
    } else {
      onChange(undefined);
    }
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>
        {label}
        {value !== undefined ? <span style={stateStyle}>({value ? 'Yes' : 'No'})</span> : null}
      </span>
      <button
        type="button"
        style={{
          ...trackStyle,
          background:
            value === undefined
              ? 'var(--color-border-strong)'
              : isOn
                ? 'var(--color-cta-primary)'
                : 'var(--color-icon-border)',
        }}
        onClick={handleClick}
        aria-label={`Toggle ${label}`}
      >
        <span
          style={{
            ...thumbStyle,
            left: value === undefined ? '11px' : isOn ? '20px' : '2px',
          }}
        />
      </button>
    </div>
  );
}
