'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';

interface DateRangeFilterProps {
  label: string;
  value: { $gte?: string; $lte?: string } | undefined;
  onChange: (value: { $gte: string; $lte: string } | undefined) => void;
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
  minWidth: '260px',
};

const dateInputStyle: CSSProperties = {
  padding: '6px 8px',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  width: '100%',
};

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: '2-digit' });
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
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const apply = () => {
    if (from && to) {
      onChange({ $gte: from, $lte: to });
    }
    setOpen(false);
  };

  const clear = () => {
    setFrom('');
    setTo('');
    onChange(undefined);
    setOpen(false);
  };

  const displayValue = value?.$gte && value?.$lte
    ? `${formatShort(value.$gte)} – ${formatShort(value.$lte)}`
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
        <span>{displayValue || 'Select dates...'}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={popoverStyle}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px', display: 'block' }}>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px', display: 'block' }}>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            {value && (
              <button
                onClick={clear}
                style={{ padding: '4px 10px', border: 'none', background: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
            <button
              onClick={apply}
              disabled={!from || !to}
              style={{
                padding: '4px 12px', border: 'none', borderRadius: '6px',
                background: from && to ? 'var(--color-cta-primary)' : 'var(--color-border)',
                color: from && to ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: '12px', fontWeight: 500, cursor: from && to ? 'pointer' : 'not-allowed',
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
