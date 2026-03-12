'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';

interface NumberRangeFilterProps {
  label: string;
  value: { $gte?: number; $lte?: number } | undefined;
  onChange: (value: { $gte?: number; $lte?: number } | undefined) => void;
}

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  background: '#FFFFFF',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  minWidth: '120px',
  justifyContent: 'space-between',
};

const popoverStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  background: '#FFFFFF',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  boxShadow: 'var(--shadow-l1)',
  zIndex: 40,
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: '220px',
};

const numInputStyle: CSSProperties = {
  padding: '6px 8px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  width: '100%',
};

export default function NumberRangeFilter({ label, value, onChange }: NumberRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(value?.$gte?.toString() || '');
  const [max, setMax] = useState(value?.$lte?.toString() || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMin(value?.$gte?.toString() || '');
    setMax(value?.$lte?.toString() || '');
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const apply = () => {
    const result: { $gte?: number; $lte?: number } = {};
    if (min !== '') result.$gte = parseFloat(min);
    if (max !== '') result.$lte = parseFloat(max);
    if (Object.keys(result).length > 0) {
      onChange(result);
    }
    setOpen(false);
  };

  const clear = () => {
    setMin('');
    setMax('');
    onChange(undefined);
    setOpen(false);
  };

  const displayValue = value
    ? [value.$gte !== undefined && `\u2265 ${value.$gte}`, value.$lte !== undefined && `\u2264 ${value.$lte}`]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <button
        style={{
          ...triggerStyle,
          color: displayValue ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-cta-primary)' : 'var(--color-border)',
        }}
        onClick={() => setOpen(!open)}
      >
        <span>{displayValue || 'Any amount...'}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={popoverStyle}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px', display: 'block' }}>Min</label>
            <input type="number" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" style={numInputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px', display: 'block' }}>Max</label>
            <input type="number" value={max} onChange={(e) => setMax(e.target.value)} placeholder="999999" style={numInputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            {value && (
              <button onClick={clear} style={{ padding: '4px 10px', border: 'none', background: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                Clear
              </button>
            )}
            <button
              onClick={apply}
              disabled={min === '' && max === ''}
              style={{
                padding: '4px 12px', border: 'none', borderRadius: '6px',
                background: (min !== '' || max !== '') ? 'var(--color-cta-primary)' : 'var(--color-border)',
                color: (min !== '' || max !== '') ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: '12px', fontWeight: 500, cursor: (min !== '' || max !== '') ? 'pointer' : 'not-allowed',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
