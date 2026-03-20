'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import type { FilterOption } from '@/types';

interface SelectFilterProps {
  label: string;
  value: string | undefined;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
  placeholder?: string;
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
  minWidth: '140px',
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

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  minWidth: '220px',
  maxHeight: '280px',
  overflowY: 'auto',
  padding: '6px 0',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  background: 'var(--color-bg-card)',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 60,
};

const optionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '9px 12px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  fontSize: '13px',
  lineHeight: '20px',
  letterSpacing: '-0.25px',
  color: 'var(--color-text-primary)',
};

export default function SelectFilter({
  label,
  value,
  options,
  onChange,
  placeholder,
}: SelectFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={labelStyle}>{label}</div>
      <button
        type="button"
        style={{
          ...triggerStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-strong)',
          boxShadow: open ? 'var(--shadow-focus)' : triggerStyle.boxShadow,
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label || placeholder || 'Select...'}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)' }}>&#x25BE;</span>
      </button>
      {open ? (
        <div style={menuStyle}>
          {value ? (
            <button
              type="button"
              style={{ ...optionStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'var(--color-menu-hover)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent';
              }}
            >
              Clear
            </button>
          ) : null}
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                style={{
                  ...optionStyle,
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? 'var(--color-cta-primary)' : 'var(--color-text-primary)',
                  background: isSelected ? 'var(--color-menu-selected)' : 'transparent',
                }}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = isSelected
                    ? 'var(--color-menu-selected)'
                    : 'var(--color-menu-hover)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = isSelected
                    ? 'var(--color-menu-selected)'
                    : 'transparent';
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
