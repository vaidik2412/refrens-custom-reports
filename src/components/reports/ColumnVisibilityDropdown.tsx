'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';

interface Props {
  table: Table<any>;
}

const btnStyle: CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tag)',
  background: 'var(--color-bg-card)',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
  whiteSpace: 'nowrap',
};

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  right: 0,
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  boxShadow: 'var(--shadow-l2)',
  zIndex: 50,
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '4px 0',
  minWidth: '180px',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '6px 12px',
  border: 'none',
  background: 'none',
  fontSize: '13px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
  letterSpacing: '-0.25px',
};

export default function ColumnVisibilityDropdown({ table }: Props) {
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

  const allColumns = table.getAllLeafColumns();
  const visibleCount = allColumns.filter((c) => c.getIsVisible()).length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        style={btnStyle}
        onClick={() => setOpen(!open)}
      >
        Columns ({visibleCount}/{allColumns.length})
      </button>
      {open && (
        <div style={menuStyle}>
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <button
              type="button"
              style={{ ...itemStyle, fontSize: '12px', color: 'var(--color-text-secondary)', padding: 0 }}
              onClick={() => table.toggleAllColumnsVisible()}
            >
              {table.getIsAllColumnsVisible() ? 'Hide all' : 'Show all'}
            </button>
          </div>
          {allColumns.map((column) => (
            <label key={column.id} style={{ ...itemStyle, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
                style={{ accentColor: 'var(--color-cta-primary)' }}
              />
              {typeof column.columnDef.header === 'string'
                ? column.columnDef.header
                : column.id}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
