'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useAsyncSuggestions } from '@/hooks/useAsyncSuggestions';
import type { ClientOption } from '@/types';

interface SearchSelectFilterProps {
  label: string;
  value: { $in: string[]; $inOptions: ClientOption[] } | undefined;
  onChange: (value: { $in: string[]; $inOptions: ClientOption[] } | undefined) => void;
  searchEndpoint: string;
  placeholder?: string;
  multi?: boolean;
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
  minWidth: '170px',
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
  minWidth: '280px',
  maxHeight: '320px',
  overflowY: 'auto',
  padding: '8px 0',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  background: 'var(--color-bg-card)',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 60,
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  minHeight: 'var(--height-input)',
  padding: '8px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
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

const checkStyle = (checked: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  border: '1.5px solid',
  borderColor: checked ? 'var(--color-cta-primary)' : 'var(--color-icon-border)',
  borderRadius: '4px',
  background: checked ? 'var(--color-cta-primary)' : 'transparent',
  color: 'var(--color-bg-card)',
  fontSize: '11px',
  flexShrink: 0,
});

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

  const selectedIds = value?.$in || [];
  const selectedOptions = value?.$inOptions || [];

  const toggleOption = (option: ClientOption) => {
    if (selectedIds.includes(option.value)) {
      const nextIds = selectedIds.filter((id) => id !== option.value);
      const nextOptions = selectedOptions.filter((selected) => selected.value !== option.value);
      onChange(nextIds.length > 0 ? { $in: nextIds, $inOptions: nextOptions } : undefined);
      return;
    }

    if (multi) {
      onChange({
        $in: [...selectedIds, option.value],
        $inOptions: [...selectedOptions, option],
      });
      return;
    }

    onChange({ $in: [option.value], $inOptions: [option] });
    setOpen(false);
  };

  const displayText =
    selectedOptions.length > 0 ? selectedOptions.map((option) => option.label).join(', ') : null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={labelStyle}>{label}</div>
      <button
        type="button"
        style={{
          ...triggerStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-strong)',
          boxShadow: open ? 'var(--shadow-focus)' : triggerStyle.boxShadow,
          color: displayText ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
        onClick={() => setOpen((current) => !current)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
          {displayText || placeholder || 'Search...'}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)' }}>&#x25BE;</span>
      </button>
      {open ? (
        <div style={menuStyle}>
          <div style={{ padding: '0 12px 8px' }}>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search or browse..."
              style={searchInputStyle}
              autoFocus
            />
          </div>
          {selectedIds.length > 0 ? (
            <button
              type="button"
              style={{ ...itemStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
              onClick={() => onChange(undefined)}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'var(--color-menu-hover)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent';
              }}
            >
              Clear all
            </button>
          ) : null}
          {!loading && query.trim() === '' && results.length > 0 ? (
            <div style={{ padding: '0 12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Suggested clients
            </div>
          ) : null}
          {loading ? (
            <div style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          ) : null}
          {!loading && results.length === 0 ? (
            <div style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {query.trim() ? 'No results' : 'No suggestions'}
            </div>
          ) : null}
          {results.map((option) => {
            const checked = selectedIds.includes(option.value);

            return (
              <button
                type="button"
                key={option.value}
                style={{
                  ...itemStyle,
                  background: checked ? 'var(--color-menu-selected)' : 'transparent',
                }}
                onClick={() => toggleOption(option)}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = checked
                    ? 'var(--color-menu-selected)'
                    : 'var(--color-menu-hover)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = checked
                    ? 'var(--color-menu-selected)'
                    : 'transparent';
                }}
              >
                {multi ? <span style={checkStyle(checked)}>{checked ? '\u2713' : null}</span> : null}
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
