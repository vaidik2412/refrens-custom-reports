'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { getFieldsByCategory, CATEGORY_LABELS } from '@/lib/field-registry';

interface FieldPickerProps {
  value: string;
  onChange: (fieldKey: string) => void;
  usedFields: string[];
}

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 'var(--radius-input)',
  background: '#FFFFFF',
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  minWidth: '160px',
  letterSpacing: '-0.25px',
  transition: 'border-color 0.15s',
  justifyContent: 'space-between',
  gap: '6px',
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
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '4px 0',
};

const categoryStyle: CSSProperties = {
  padding: '6px 12px 4px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const itemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '7px 12px',
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  letterSpacing: '-0.25px',
  transition: 'background 0.1s',
};

const CATEGORY_ORDER = ['core', 'financial', 'tax', 'metadata'];

export default function FieldPicker({ value, onChange, usedFields }: FieldPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const grouped = getFieldsByCategory();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Find label for selected value
  const selectedLabel = value
    ? Object.values(grouped).flat().find((f) => f.key === value)?.label || value
    : 'Select field...';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        style={{
          ...triggerStyle,
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-cta-primary)' : undefined,
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#9662;</span>
      </button>

      {open && (
        <div style={menuStyle}>
          {CATEGORY_ORDER.map((cat) => {
            const fields = grouped[cat];
            if (!fields || fields.length === 0) return null;
            return (
              <div key={cat}>
                <div style={categoryStyle}>{CATEGORY_LABELS[cat] || cat}</div>
                {fields.map((field) => {
                  const isUsed = usedFields.includes(field.key) && field.key !== value;
                  return (
                    <button
                      key={field.key}
                      type="button"
                      style={{
                        ...itemStyle,
                        fontWeight: field.key === value ? 500 : 400,
                        background: field.key === value ? 'var(--color-bg-alt)' : 'none',
                        opacity: isUsed ? 0.45 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (field.key !== value) {
                          (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-alt)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (field.key !== value) {
                          (e.currentTarget as HTMLElement).style.background = 'none';
                        }
                      }}
                      onClick={() => {
                        onChange(field.key);
                        setOpen(false);
                      }}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
