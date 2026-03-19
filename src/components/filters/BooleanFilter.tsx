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
  padding: '8px 0',
  gap: '12px',
};

const labelStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.25px',
};

const toggleTrackStyle: CSSProperties = {
  width: '36px',
  height: '20px',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'background 0.2s',
  position: 'relative',
  border: 'none',
  padding: 0,
  flexShrink: 0,
};

const toggleThumbStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: 'var(--color-bg-card)',
  position: 'absolute',
  top: '2px',
  transition: 'left 0.2s',
  boxShadow: 'var(--shadow-toggle-thumb)',
};

export default function BooleanFilter({ label, value, onChange }: BooleanFilterProps) {
  const isOn = value === true;

  const handleClick = () => {
    if (value === undefined) {
      onChange(true);
    } else if (value === true) {
      onChange(false);
    } else {
      onChange(undefined); // cycle: undefined → true → false → undefined
    }
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>
        {label}
        {value !== undefined && (
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
            ({value ? 'Yes' : 'No'})
          </span>
        )}
      </span>
      <button
        style={{
          ...toggleTrackStyle,
          background: value === undefined
            ? 'var(--color-border)'
            : isOn
              ? 'var(--color-cta-primary)'
              : 'var(--color-icon-border)',
        }}
        onClick={handleClick}
        aria-label={`Toggle ${label}`}
      >
        <div
          style={{
            ...toggleThumbStyle,
            left: value === undefined ? '10px' : isOn ? '18px' : '2px',
          }}
        />
      </button>
    </div>
  );
}
