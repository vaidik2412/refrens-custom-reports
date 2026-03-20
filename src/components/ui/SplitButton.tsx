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

const groupStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'stretch',
  borderRadius: 'var(--radius-input)',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.08)',
  overflow: 'hidden',
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 'var(--height-button)',
  padding: '0 16px',
  border: '1px solid var(--color-cta-primary)',
  borderRight: 'none',
  background: 'var(--color-cta-primary)',
  color: 'var(--color-bg-card)',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '-0.25px',
  lineHeight: '20px',
  transition: 'background-color 0.16s ease',
};

const caretButtonStyle: CSSProperties = {
  width: '40px',
  minHeight: 'var(--height-button)',
  border: '1px solid var(--color-cta-primary)',
  borderLeft: '1px solid var(--color-divider-on-primary)',
  background: 'var(--color-cta-primary)',
  color: 'var(--color-bg-card)',
  fontSize: '12px',
  transition: 'background-color 0.16s ease',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  right: 0,
  minWidth: '220px',
  padding: '6px 0',
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 60,
};

const itemStyle: CSSProperties = {
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
  transition: 'background-color 0.16s ease',
};

const dividerStyle: CSSProperties = {
  height: '1px',
  background: 'var(--color-border)',
  margin: '6px 0',
};

export default function SplitButton({ label, onClick, items, onSelect }: SplitButtonProps) {
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
    <div ref={ref} style={groupStyle}>
      <button
        type="button"
        style={primaryButtonStyle}
        onClick={onClick}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = 'var(--color-cta-primary-hover)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'var(--color-cta-primary)';
        }}
      >
        {label}
      </button>
      <button
        type="button"
        style={caretButtonStyle}
        onClick={() => setOpen((current) => !current)}
        onMouseEnter={(event) => {
          event.currentTarget.style.background = 'var(--color-cta-primary-hover)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.background = 'var(--color-cta-primary)';
        }}
        aria-label="Open more actions"
      >
        &#x25BE;
      </button>
      {open ? (
        <div style={menuStyle}>
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
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
