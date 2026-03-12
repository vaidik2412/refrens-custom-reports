'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  header?: React.ReactNode;
  width?: number;
}

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  background: '#FFFFFF',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  boxShadow: 'var(--shadow-l1)',
  zIndex: 40,
  minWidth: '200px',
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '4px 0',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  transition: 'background 0.1s',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  letterSpacing: '-0.25px',
};

const dividerStyle: CSSProperties = {
  height: '1px',
  background: 'var(--color-border)',
  margin: '4px 0',
};

export default function Dropdown({ trigger, items, onSelect, align = 'left', header, width }: DropdownProps) {
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
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          style={{
            ...menuStyle,
            [align === 'right' ? 'right' : 'left']: 0,
            ...(width ? { width, minWidth: width } : {}),
          }}
        >
          {header}
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} style={dividerStyle} />;
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
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
