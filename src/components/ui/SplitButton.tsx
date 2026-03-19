'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

interface SplitButtonItem {
  label: string;
  value: string;
  danger?: boolean;
  divider?: boolean;
}

interface SplitButtonProps {
  label: string;
  onClick: () => void;
  items: SplitButtonItem[];
  onSelect: (value: string) => void;
}

const btnGroupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'stretch',
  position: 'relative',
};

const mainBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 16px',
  background: 'var(--color-cta-primary)',
  color: 'var(--color-bg-card)',
  border: 'none',
  borderRadius: 'var(--radius-input) 0 0 var(--radius-input)',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '-0.25px',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const caretBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 10px',
  background: 'var(--color-cta-primary)',
  color: 'var(--color-bg-card)',
  border: 'none',
  borderLeft: '1px solid var(--color-divider-on-primary)',
  borderRadius: '0 var(--radius-input) var(--radius-input) 0',
  cursor: 'pointer',
  fontSize: '12px',
  transition: 'background 0.15s',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  right: 0,
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  boxShadow: 'var(--shadow-l1)',
  zIndex: 40,
  minWidth: '200px',
  padding: '4px 0',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  letterSpacing: '-0.25px',
  transition: 'background 0.1s',
};

export default function SplitButton({ label, onClick, items, onSelect }: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={btnGroupStyle}>
      <button style={mainBtnStyle} onClick={onClick}>
        {label}
      </button>
      <button style={caretBtnStyle} onClick={() => setOpen(!open)}>
        &#x25BC;
      </button>
      {open && (
        <div style={menuStyle}>
          {items.map((item, i) => {
            if (item.divider) {
              return (
                <div
                  key={i}
                  style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }}
                />
              );
            }
            return (
              <button
                key={item.value}
                style={{
                  ...itemStyle,
                  color: item.danger ? 'var(--color-error)' : itemStyle.color,
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'var(--color-bg-alt)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'none';
                }}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
