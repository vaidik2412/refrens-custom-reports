'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';

interface NumberRangeFilterProps {
  label: string;
  value: { $gte?: number; $lte?: number } | undefined;
  onChange: (value: { $gte?: number; $lte?: number } | undefined) => void;
}

const labelStyle: CSSProperties = {
  marginBottom: '6px',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '16px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
};

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  minWidth: '170px',
  minHeight: 'var(--height-input)',
  padding: '0 12px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
  fontSize: '13px',
  lineHeight: '20px',
  letterSpacing: '-0.25px',
};

const popoverStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  minWidth: '260px',
  padding: '16px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  background: 'var(--color-bg-card)',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const fieldLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 'var(--height-input)',
  padding: '8px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
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
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  const displayValue = value
    ? [
        value.$gte !== undefined ? `>= ${value.$gte}` : null,
        value.$lte !== undefined ? `<= ${value.$lte}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={labelStyle}>{label}</div>
      <button
        type="button"
        style={{
          ...triggerStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-strong)',
          boxShadow: open ? 'var(--shadow-focus)' : triggerStyle.boxShadow,
          color: displayValue ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{displayValue || 'Any amount...'}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)' }}>&#x25BE;</span>
      </button>
      {open ? (
        <div style={popoverStyle}>
          <div>
            <label style={fieldLabelStyle}>Min</label>
            <input
              type="number"
              value={min}
              onChange={(event) => setMin(event.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Max</label>
            <input
              type="number"
              value={max}
              onChange={(event) => setMax(event.target.value)}
              placeholder="999999"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {value ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMin('');
                  setMax('');
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={min === '' && max === ''}
              onClick={() => {
                const next: { $gte?: number; $lte?: number } = {};

                if (min !== '') {
                  next.$gte = parseFloat(min);
                }
                if (max !== '') {
                  next.$lte = parseFloat(max);
                }

                if (Object.keys(next).length > 0) {
                  onChange(next);
                }

                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
