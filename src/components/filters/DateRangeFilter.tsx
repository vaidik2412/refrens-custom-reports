'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';

interface DateRangeFilterProps {
  label: string;
  value: { $gte?: string; $lte?: string } | undefined;
  onChange: (value: { $gte: string; $lte: string } | undefined) => void;
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
  minWidth: '180px',
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
  minWidth: '280px',
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

function formatShort(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: '2-digit',
    year: '2-digit',
  });
}

export default function DateRangeFilter({ label, value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value?.$gte || '');
  const [to, setTo] = useState(value?.$lte || '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFrom(value?.$gte || '');
    setTo(value?.$lte || '');
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

  const displayValue =
    value?.$gte && value?.$lte ? `${formatShort(value.$gte)} - ${formatShort(value.$lte)}` : null;

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
        <span>{displayValue || 'Select dates...'}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)' }}>&#x25BE;</span>
      </button>
      {open ? (
        <div style={popoverStyle}>
          <div>
            <label style={fieldLabelStyle}>From</label>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>To</label>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {value ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFrom('');
                  setTo('');
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={!from || !to}
              onClick={() => {
                if (from && to) {
                  onChange({ $gte: from, $lte: to });
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
