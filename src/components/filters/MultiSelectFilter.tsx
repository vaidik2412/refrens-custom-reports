'use client';

import { CSSProperties, useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface MultiSelectFilterProps {
  label: string;
  value: string[];
  options?: { label: string; value: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowFreeText?: boolean;
  searchEndpoint?: string;
  operator?: '$in' | '$all';
  operatorOptions?: Array<{ label: string; value: '$in' | '$all' }>;
  onOperatorChange?: (operator: '$in' | '$all') => void;
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
  background: '#FFFFFF',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  minWidth: '120px',
  justifyContent: 'space-between',
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
  maxHeight: '280px',
  overflowY: 'auto',
  padding: '4px 0',
};

const checkItemStyle: CSSProperties = {
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
  const [remoteOptions, setRemoteOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debouncedInput = useDebounce(input, 300);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!open || !searchEndpoint) return;

    let cancelled = false;

    async function loadOptions() {
      setLoading(true);
      try {
        const res = await fetch(`${searchEndpoint}?q=${encodeURIComponent(debouncedInput)}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) {
          setRemoteOptions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch options:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [debouncedInput, open, searchEndpoint]);

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const addFreeText = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const filteredOptions = searchEndpoint
    ? remoteOptions
    : options.filter((o) => o.label.toLowerCase().includes(input.toLowerCase()));

  const displayedOptions = filteredOptions.reduce<Array<{ label: string; value: string }>>((acc, option) => {
    if (!acc.find((existing) => existing.value === option.value)) {
      acc.push(option);
    }
    return acc;
  }, []);

  const pendingFreeText = input.trim();
  const hasPendingFreeText =
    allowFreeText &&
    pendingFreeText.length > 0 &&
    !value.some((item) => item.toLowerCase() === pendingFreeText.toLowerCase()) &&
    !displayedOptions.some((item) => item.value.toLowerCase() === pendingFreeText.toLowerCase());

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <button
        type="button"
        style={{
          ...triggerStyle,
          color: value.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-cta-primary)' : 'var(--color-border)',
        }}
        onClick={() => setOpen(!open)}
      >
        <span>{value.length > 0 ? `${value.length} selected` : placeholder || 'Select...'}</span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>&#x25BC;</span>
      </button>
      {open && (
        <div style={menuStyle}>
          {operatorOptions && operatorOptions.length > 1 && onOperatorChange && (
            <div style={{ padding: '8px 8px 0' }}>
              <select
                value={operator}
                onChange={(e) => onOperatorChange(e.target.value as '$in' | '$all')}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: '#FFFFFF',
                  outline: 'none',
                }}
              >
                {operatorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ padding: '4px 8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && allowFreeText) addFreeText();
              }}
              placeholder={
                allowFreeText
                  ? 'Search or add...'
                  : searchEndpoint
                    ? 'Search or browse...'
                    : 'Filter...'
              }
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '13px',
                outline: 'none',
              }}
              autoFocus
            />
          </div>
          {hasPendingFreeText && (
            <button
              type="button"
              style={{ ...checkItemStyle, fontStyle: 'italic' }}
              onClick={addFreeText}
            >
              Add &ldquo;{pendingFreeText}&rdquo;
            </button>
          )}
          {value.length > 0 && (
            <button
              type="button"
              style={{ ...checkItemStyle, color: 'var(--color-text-secondary)', fontStyle: 'italic', fontSize: '12px' }}
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          )}
          {loading && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          )}
          {!loading && displayedOptions.length === 0 && !hasPendingFreeText && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              No results
            </div>
          )}
          {displayedOptions.map((opt) => (
            <button
              type="button"
              key={opt.value}
              style={checkItemStyle}
              onClick={() => toggle(opt.value)}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--color-bg-alt)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
            >
              <span style={{
                width: '16px', height: '16px', border: '1.5px solid',
                borderColor: value.includes(opt.value) ? 'var(--color-cta-primary)' : 'var(--color-icon-border)',
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: value.includes(opt.value) ? 'var(--color-cta-primary)' : 'transparent',
                color: '#FFFFFF', fontSize: '11px', flexShrink: 0,
              }}>
                {value.includes(opt.value) && '\u2713'}
              </span>
              {opt.label}
            </button>
          ))}
          {/* Show free-text values that aren't in options */}
          {value
            .filter((v) => !displayedOptions.find((o) => o.value === v))
            .map((v) => (
              <button
                type="button"
                key={v}
                style={checkItemStyle}
                onClick={() => toggle(v)}
              >
                <span style={{
                  width: '16px', height: '16px', border: '1.5px solid var(--color-cta-primary)',
                  borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-cta-primary)', color: '#FFFFFF', fontSize: '11px', flexShrink: 0,
                }}>
                  {'\u2713'}
                </span>
                {v}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
