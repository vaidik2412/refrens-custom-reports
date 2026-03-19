'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';
import { useAsyncSuggestions } from '@/hooks/useAsyncSuggestions';
import type { ClientOption } from '@/types';

interface SearchSelectFilterProps {
  label: string;
  value: { $in: string[]; $inOptions: ClientOption[] } | undefined;
  onChange: (value: { $in: string[]; $inOptions: ClientOption[] } | undefined) => void;
  searchEndpoint: string; // e.g. '/api/clients/search'
  placeholder?: string;
  multi?: boolean;
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
  background: 'var(--color-bg-card)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  minWidth: '140px',
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
  minWidth: '240px',
  maxHeight: '280px',
  overflowY: 'auto',
  padding: '4px 0',
};

const optStyle: CSSProperties = {
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

export default function SearchSelectFilter({
  label,
  value,
  onChange,
  searchEndpoint,
  placeholder,
  multi = true,
}: SearchSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { results, loading } = useAsyncSuggestions<ClientOption>(searchEndpoint, open, query);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedIds = value?.$in || [];
  const selectedOptions = value?.$inOptions || [];

  const toggleOption = (opt: ClientOption) => {
    if (selectedIds.includes(opt.value)) {
      const newIds = selectedIds.filter((id) => id !== opt.value);
      const newOpts = selectedOptions.filter((o) => o.value !== opt.value);
      onChange(newIds.length > 0 ? { $in: newIds, $inOptions: newOpts } : undefined);
    } else {
      if (multi) {
        onChange({
          $in: [...selectedIds, opt.value],
          $inOptions: [...selectedOptions, opt],
        });
      } else {
        onChange({ $in: [opt.value], $inOptions: [opt] });
        setOpen(false);
      }
    }
  };

  const displayText =
    selectedOptions.length > 0
      ? selectedOptions.map((o) => o.label).join(', ')
      : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <button
        type="button"
        style={{
          ...triggerStyle,
          color: displayText ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-cta-primary)' : 'var(--color-border)',
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
          {displayText || placeholder || 'Search...'}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={menuStyle}>
          <div style={{ padding: '4px 8px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or browse..."
              style={{
                width: '100%', padding: '6px 8px',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tag)',
                fontSize: '13px', outline: 'none',
              }}
              autoFocus
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              style={{ ...optStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '12px' }}
              onClick={() => { onChange(undefined); }}
            >
              Clear all
            </button>
          )}
          {!loading && query.trim() === '' && results.length > 0 && (
            <div style={{ padding: '8px 12px 4px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Suggested clients
            </div>
          )}
          {loading && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {query.trim() ? 'No results' : 'No suggestions'}
            </div>
          )}
          {results.map((opt) => (
            <button
              type="button"
              key={opt.value}
              style={{
                ...optStyle,
                background: selectedIds.includes(opt.value) ? 'var(--color-bg-alt)' : 'none',
              }}
              onClick={() => toggleOption(opt)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-alt)'; }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  selectedIds.includes(opt.value) ? 'var(--color-bg-alt)' : 'none';
              }}
            >
              {multi && (
                <span style={{
                  width: '16px', height: '16px', border: '1.5px solid',
                  borderColor: selectedIds.includes(opt.value) ? 'var(--color-cta-primary)' : 'var(--color-icon-border)',
                  borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: selectedIds.includes(opt.value) ? 'var(--color-cta-primary)' : 'transparent',
                  color: 'var(--color-bg-card)', fontSize: '11px', flexShrink: 0,
                }}>
                  {selectedIds.includes(opt.value) && '\u2713'}
                </span>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
