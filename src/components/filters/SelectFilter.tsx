'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';
import type { FilterOption } from '@/types';

interface SelectFilterProps {
  label: string;
  value: string | undefined;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-card)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  minWidth: '120px',
  justifyContent: 'space-between',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  boxShadow: 'var(--shadow-l1)',
  zIndex: 40,
  minWidth: '180px',
  maxHeight: '240px',
  overflowY: 'auto',
  padding: '4px 0',
};

const optStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '7px 12px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  letterSpacing: '-0.25px',
};

export default function SelectFilter({ label, value, options, onChange, placeholder }: SelectFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <button
        style={{
          ...triggerStyle,
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-cta-primary)' : 'var(--color-border)',
        }}
        onClick={() => setOpen(!open)}
      >
        <span>{selected?.label || placeholder || 'Select...'}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={menuStyle}>
          {value && (
            <button
              style={{ ...optStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
              onClick={() => { onChange(undefined); setOpen(false); }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--color-bg-alt)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
            >
              Clear
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...optStyle,
                fontWeight: opt.value === value ? 500 : 400,
                background: opt.value === value ? 'var(--color-bg-alt)' : 'none',
              }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--color-bg-alt)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = opt.value === value ? 'var(--color-bg-alt)' : 'none'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
