'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { getFieldsByCategoryForBillType, CATEGORY_LABELS } from '@/lib/field-registry';

interface FieldPickerProps {
  value: string;
  onChange: (fieldKey: string) => void;
  usedFields: string[];
  billType: string | null;
}

const triggerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  minHeight: 'var(--height-input)',
  padding: '0 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  minWidth: '180px',
  letterSpacing: '-0.25px',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
  transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 40,
  minWidth: '260px',
  maxHeight: '320px',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  minHeight: 'var(--height-input)',
  padding: '8px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  letterSpacing: '-0.25px',
  background: 'var(--color-bg-card)',
};

const categoryStyle: CSSProperties = {
  padding: '0 12px 8px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const itemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '9px 12px',
  fontSize: '13px',
  lineHeight: '20px',
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

export default function FieldPicker({ value, onChange, usedFields, billType }: FieldPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const grouped = getFieldsByCategoryForBillType(billType);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setSearch('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Filter fields by search query
  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result: Record<string, typeof grouped[string]> = {};
    for (const [cat, fields] of Object.entries(grouped)) {
      const matched = fields.filter((f) => f.label.toLowerCase().includes(q));
      if (matched.length > 0) result[cat] = matched;
    }
    return result;
  }, [grouped, search]);

  const hasResults = Object.values(filteredGrouped).some((f) => f.length > 0);

  // Find label for selected value
  const selectedLabel = value
    ? Object.values(grouped).flat().find((f) => f.key === value)?.label || value
    : 'Select field...';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button
        type="button"
        style={{
          ...triggerStyle,
          width: '100%',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-input)',
          boxShadow: open ? 'var(--shadow-focus)' : triggerStyle.boxShadow,
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)' }}>&#x25BE;</span>
      </button>

      {open && (
        <div style={menuStyle}>
          <div style={{ padding: '12px 12px 8px' }}>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fields..."
              style={searchInputStyle}
            />
          </div>
          <div style={{ overflowY: 'auto', padding: '0 0 8px' }}>
            {!hasResults && (
              <div style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                No fields match &ldquo;{search}&rdquo;
              </div>
            )}
            {CATEGORY_ORDER.map((cat) => {
              const fields = filteredGrouped[cat];
              if (!fields || fields.length === 0) return null;
              return (
                <div key={cat}>
                  <div style={categoryStyle}>{CATEGORY_LABELS[cat] || cat}</div>
                  {fields.map((field) => {
                    return (
                      <button
                        key={field.key}
                        type="button"
                        style={{
                          ...itemStyle,
                          fontWeight: field.key === value ? 500 : 400,
                          background: field.key === value ? 'var(--color-menu-selected)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (field.key !== value) {
                            (e.currentTarget as HTMLElement).style.background = 'var(--color-menu-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (field.key !== value) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
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
        </div>
      )}
    </div>
  );
}
