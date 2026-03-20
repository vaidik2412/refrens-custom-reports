'use client';

import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  header?: ReactNode;
  width?: number;
}

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 50,
  minWidth: '220px',
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '6px 0',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '9px 12px',
  border: 'none',
  background: 'transparent',
  width: '100%',
  textAlign: 'left',
  fontSize: '13px',
  lineHeight: '20px',
  letterSpacing: '-0.25px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  transition: 'background-color 0.16s ease, color 0.16s ease',
};

const dividerStyle: CSSProperties = {
  height: '1px',
  background: 'var(--color-border)',
  margin: '6px 0',
};

export default function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  header,
  width,
}: DropdownProps) {
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

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
      >
        {trigger}
      </div>
      {open ? (
        <div
          style={{
            ...menuStyle,
            [align === 'right' ? 'right' : 'left']: 0,
            ...(width ? { width, minWidth: width } : {}),
          }}
        >
          {header}
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`divider-${index}`} style={dividerStyle} />;
            }

            return (
              <button
                key={item.value}
                type="button"
                style={{
                  ...itemStyle,
                  color: item.danger ? 'var(--color-error)' : itemStyle.color,
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = 'var(--color-menu-hover)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = 'transparent';
                }}
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
              >
                {item.icon ? <span>{item.icon}</span> : null}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
