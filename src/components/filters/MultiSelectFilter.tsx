'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useAsyncSuggestions } from '@/hooks/useAsyncSuggestions';

interface MultiSelectFilterProps {
  label: string;
  value: string[];
  options?: { label: string; value: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowFreeText?: boolean;
  searchEndpoint?: string;
  operator?: '$in' | '$nin' | '$all';
  operatorOptions?: Array<{ label: string; value: '$in' | '$nin' | '$all' }>;
  onOperatorChange?: (operator: '$in' | '$nin' | '$all') => void;
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
  minWidth: '150px',
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
  minWidth: '260px',
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

export default function MultiSelectFilter({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  allowFreeText = false,
  searchEndpoint,
  operator = '$in',
  operatorOptions,
  onOperatorChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { results: remoteOptions, loading } = useAsyncSuggestions(searchEndpoint, open, input);

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

  const toggle = (nextValue: string) => {
    if (value.includes(nextValue)) {
      onChange(value.filter((existing) => existing !== nextValue));
      return;
    }

    onChange([...value, nextValue]);
  };

  const addFreeText = () => {
    const trimmed = input.trim();

    if (trimmed && !value.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }

    setInput('');
  };

  const handleInputBlur = () => {
    if (allowFreeText && input.trim()) {
      addFreeText();
    }

    window.setTimeout(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 0);
  };

  const filteredOptions = searchEndpoint
    ? remoteOptions
    : options.filter((option) => option.label.toLowerCase().includes(input.toLowerCase()));

  const seen = new Set<string>();
  const displayedOptions = filteredOptions.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });

  const pendingFreeText = input.trim();
  const hasPendingFreeText =
    allowFreeText &&
    pendingFreeText.length > 0 &&
    !value.some((item) => item.toLowerCase() === pendingFreeText.toLowerCase()) &&
    !displayedOptions.some((item) => item.value.toLowerCase() === pendingFreeText.toLowerCase());

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={labelStyle}>{label}</div>
      <button
        type="button"
        style={{
          ...triggerStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-strong)',
          boxShadow: open ? 'var(--shadow-focus)' : triggerStyle.boxShadow,
          color: value.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value.length > 0 ? `${value.length} selected` : placeholder || 'Select...'}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)' }}>&#x25BE;</span>
      </button>
      {open ? (
        <div style={menuStyle}>
          {operatorOptions && operatorOptions.length > 1 && onOperatorChange ? (
            <div style={{ padding: '0 12px 8px' }}>
              <select
                value={operator}
                onChange={(event) => onOperatorChange(event.target.value as '$in' | '$nin' | '$all')}
                style={searchInputStyle}
              >
                {operatorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div style={{ padding: '0 12px 8px' }}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && allowFreeText) {
                  addFreeText();
                }
              }}
              onBlur={handleInputBlur}
              placeholder={
                allowFreeText ? 'Search or add...' : searchEndpoint ? 'Search or browse...' : 'Filter...'
              }
              style={searchInputStyle}
              autoFocus
            />
          </div>
          {hasPendingFreeText ? (
            <button
              type="button"
              style={{ ...itemStyle, fontStyle: 'italic' }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={addFreeText}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = 'var(--color-menu-hover)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent';
              }}
            >
              Add &ldquo;{pendingFreeText}&rdquo;
            </button>
          ) : null}
          {value.length > 0 ? (
            <button
              type="button"
              style={{ ...itemStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange([])}
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
          {loading ? (
            <div style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          ) : null}
          {!loading && displayedOptions.length === 0 && !hasPendingFreeText ? (
            <div style={{ padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              No results
            </div>
          ) : null}
          {displayedOptions.map((option) => {
            const checked = value.includes(option.value);

            return (
              <button
                type="button"
                key={option.value}
                style={{
                  ...itemStyle,
                  background: checked ? 'var(--color-menu-selected)' : 'transparent',
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggle(option.value)}
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
                <span style={checkStyle(checked)}>{checked ? '\u2713' : null}</span>
                {option.label}
              </button>
            );
          })}
          {value
            .filter((selected) => !displayedOptions.find((option) => option.value === selected))
            .map((selected) => (
              <button
                type="button"
                key={selected}
                style={{ ...itemStyle, background: 'var(--color-menu-selected)' }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggle(selected)}
              >
                <span style={checkStyle(true)}>{'\u2713'}</span>
                {selected}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
