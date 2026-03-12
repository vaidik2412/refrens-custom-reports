'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';

interface MultiSelectFilterProps {
  label: string;
  value: string[];
  options?: { label: string; value: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowFreeText?: boolean;
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

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  background: '#FFFFFF',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  boxShadow: 'var(--shadow-l1)',
  zIndex: 40,
  minWidth: '220px',
  maxHeight: '280px',
  overflowY: 'auto',
  padding: '4px 0',
};

const checkItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 12px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
};

export default function MultiSelectFilter({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  allowFreeText = false,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const addFreeText = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <button
        style={{
          ...triggerStyle,
          color: value.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-cta-primary)' : 'var(--color-border)',
        }}
        onClick={() => setOpen(!open)}
      >
        <span>{value.length > 0 ? `${value.length} selected` : placeholder || 'Select...'}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={menuStyle}>
          <div style={{ padding: '4px 8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && allowFreeText) addFreeText();
              }}
              placeholder={allowFreeText ? 'Type to add...' : 'Filter...'}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
              }}
              autoFocus
            />
          </div>
          {value.length > 0 && (
            <button
              style={{ ...checkItemStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '12px' }}
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          )}
          {filteredOptions.map((opt) => (
            <button
              key={opt.value}
              style={checkItemStyle}
              onClick={() => toggle(opt.value)}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--color-bg-alt)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
            >
              <span style={{
                width: '16px', height: '16px', border: '1.5px solid',
                borderColor: value.includes(opt.value) ? 'var(--color-cta-primary)' : 'var(--color-icon-border)',
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: value.includes(opt.value) ? 'var(--color-cta-primary)' : 'transparent',
                color: '#FFFFFF', fontSize: '11px', flexShrink: 0,
              }}>
                {value.includes(opt.value) && '\u2713'}
              </span>
              {opt.label}
            </button>
          ))}
          {/* Show free-text values that aren't in options */}
          {value
            .filter((v) => !options.find((o) => o.value === v))
            .map((v) => (
              <button
                key={v}
                style={checkItemStyle}
                onClick={() => toggle(v)}
              >
                <span style={{
                  width: '16px', height: '16px', border: '1.5px solid var(--color-cta-primary)',
                  borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-cta-primary)', color: '#FFFFFF', fontSize: '11px', flexShrink: 0,
                }}>
                  {'\u2713'}
                </span>
                {v}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
