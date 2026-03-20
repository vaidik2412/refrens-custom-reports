'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { useAsyncSuggestions } from '@/hooks/useAsyncSuggestions';
import { getFieldEntry } from '@/lib/field-registry';
import RadioGroup from '@/components/ui/RadioGroup';
import Pill from '@/components/ui/Pill';
import { PRESET_GROUPS, DYNAMIC_PRESET_LABELS, resolveDynamicPreset, formatDateDisplay } from '@/lib/date-utils';
import type { Operator } from '@/types/query-builder';
import type { DynamicPreset } from '@/types';

interface ValueInputProps {
  fieldKey: string;
  operator: Operator;
  value: any;
  onChange: (value: any) => void;
}

const inputStyle: CSSProperties = {
  minHeight: 'var(--height-input)',
  padding: '8px 12px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  outline: 'none',
  letterSpacing: '-0.25px',
  minWidth: '140px',
  background: 'var(--color-bg-card)',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
  transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const popoverStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  right: 0,
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 40,
  maxHeight: '240px',
  overflowY: 'auto',
  padding: '8px 0',
};

const menuSectionLabelStyle: CSSProperties = {
  padding: '0 12px 8px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const menuItemStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '9px 12px',
  fontSize: '13px',
  lineHeight: '20px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
  color: 'var(--color-text-primary)',
};

const tokenFieldStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
  minHeight: 'var(--height-input)',
  padding: '6px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
  transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
};

const tokenFieldInputStyle: CSSProperties = {
  flex: '1 1 120px',
  minWidth: '120px',
  minHeight: '28px',
  padding: '0 6px',
  border: 'none',
  outline: 'none',
  fontSize: '13px',
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  letterSpacing: '-0.25px',
  background: 'transparent',
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--color-border-input-focus)';
    e.target.style.boxShadow = 'var(--shadow-focus)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--color-border-input)';
    e.target.style.boxShadow = '0 1px 2px rgba(20, 28, 39, 0.04)';
  },
};

type AsyncOption = { label: string; value: string };

// ── Multi-select dropdown (for $in on enums) ────────────────────────

function MultiSelectDropdown({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: string }>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
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

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', width: '100%' }}>
      <div
        role="button"
        tabIndex={0}
        style={{
          ...tokenFieldStyle,
          width: '100%',
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-input)',
          boxShadow: open ? 'var(--shadow-focus)' : tokenFieldStyle.boxShadow,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
      >
        {value.length === 0 && (
          <span style={{ color: 'var(--color-text-secondary)' }}>Select values...</span>
        )}
        {value.length > 0 && value.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <Pill
              key={v}
              label={opt?.label || v}
              onRemove={(e) => {
                e.stopPropagation();
                onChange(value.filter((val) => val !== v));
              }}
              variant="brand"
            />
          );
        })}
        <span style={{ fontSize: '10px', color: 'var(--color-icon-muted)', marginLeft: 'auto', flexShrink: 0 }}>&#x25BE;</span>
      </div>
      {open && (
        <div style={{ ...popoverStyle, minWidth: '220px' }}>
          {options.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                letterSpacing: '-0.25px',
                background: value.includes(opt.value) ? 'var(--color-menu-selected)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = value.includes(opt.value)
                  ? 'var(--color-menu-selected)'
                  : 'var(--color-menu-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = value.includes(opt.value)
                  ? 'var(--color-menu-selected)'
                  : 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                style={{ accentColor: 'var(--color-cta-primary)' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Search + select (for search-type fields like client) ────────────

function SearchSelectInput({
  endpoint,
  value,
  onChange,
}: {
  endpoint: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [knownOptions, setKnownOptions] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);
  const { results, loading } = useAsyncSuggestions<AsyncOption>(endpoint, open, query);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (results.length === 0) {
      return;
    }
    setKnownOptions((prev) => {
      const next = { ...prev };
      for (const option of results) {
        next[option.value] = option.label;
      }
      return next;
    });
  }, [results]);

  const addValue = (option: AsyncOption) => {
    if (!value.includes(option.value)) {
      onChange([...value, option.value]);
    }
    setKnownOptions((prev) => ({ ...prev, [option.value]: option.label }));
    setQuery('');
  };

  const removeValue = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <div
        style={{
          ...tokenFieldStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-input)',
          boxShadow: open ? 'var(--shadow-focus)' : tokenFieldStyle.boxShadow,
        }}
      >
        {value.map((v) => (
          <Pill key={v} label={knownOptions[v] || v} onRemove={() => removeValue(v)} variant="brand" />
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={value.length > 0 ? 'Search or browse more...' : 'Search or browse clients...'}
          style={tokenFieldInputStyle}
        />
      </div>
      {open && (
        <div style={{ ...popoverStyle, minWidth: '220px', maxHeight: '220px' }}>
          {query.trim() === '' && !loading && results.length > 0 && (
            <div style={menuSectionLabelStyle}>
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
          {results.map((r) => (
            <button
              key={r.value}
              type="button"
              style={{
                ...menuItemStyle,
                background: value.includes(r.value) ? 'var(--color-menu-selected)' : 'transparent',
              }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = value.includes(r.value)
                  ? 'var(--color-menu-selected)'
                  : 'var(--color-menu-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = value.includes(r.value)
                  ? 'var(--color-menu-selected)'
                  : 'transparent';
              }}
              onClick={() => addValue(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tag input for multi-enum (freeform text entry) ──────────────────

function TagInput({
  value,
  onChange,
  endpoint,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  endpoint?: string;
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { results, loading } = useAsyncSuggestions<AsyncOption>(endpoint, open, input);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addTag = (rawTag: string = input) => {
    const tag = rawTag.trim();
    if (tag && !value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setInput('');
  };

  const handleInputBlur = () => {
    if (input.trim()) {
      addTag();
    }
    window.setTimeout(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 0);
  };

  const pendingTag = input.trim();
  const canAddPendingTag =
    pendingTag.length > 0 &&
    !value.some((existing) => existing.toLowerCase() === pendingTag.toLowerCase()) &&
    !results.some((result) => result.value.toLowerCase() === pendingTag.toLowerCase());

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      <div
        style={{
          ...tokenFieldStyle,
          borderColor: open ? 'var(--color-border-input-focus)' : 'var(--color-border-input)',
          boxShadow: open ? 'var(--shadow-focus)' : tokenFieldStyle.boxShadow,
        }}
      >
        {value.map((v) => (
          <Pill key={v} label={v} onRemove={() => onChange(value.filter((t) => t !== v))} variant="brand" />
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={handleInputBlur}
          placeholder={value.length > 0 ? 'Search or add more tags...' : 'Search or add tags...'}
          style={tokenFieldInputStyle}
        />
      </div>
      {open && (
        <div style={{ ...popoverStyle, minWidth: '220px', maxHeight: '240px' }}>
          {input.trim() === '' && !loading && results.length > 0 && (
            <div style={menuSectionLabelStyle}>
              Suggested tags
            </div>
          )}
          {canAddPendingTag && (
            <button
              type="button"
              style={{
                ...menuItemStyle,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
              }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-menu-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              onClick={() => addTag(pendingTag)}
            >
              Add &ldquo;{pendingTag}&rdquo;
            </button>
          )}
          {loading && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          )}
          {!loading && results.length === 0 && !canAddPendingTag && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {input.trim() ? 'No tags found' : 'No suggestions'}
            </div>
          )}
          {results.map((result) => (
            <button
              key={result.value}
              type="button"
              style={{
                ...menuItemStyle,
                background: value.includes(result.value) ? 'var(--color-menu-selected)' : 'transparent',
              }}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = value.includes(result.value)
                  ? 'var(--color-menu-selected)'
                  : 'var(--color-menu-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = value.includes(result.value)
                  ? 'var(--color-menu-selected)'
                  : 'transparent';
              }}
              onClick={() => addTag(result.value)}
            >
              {result.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Date Between with Fixed/Dynamic toggle ──────────────────────────

const presetSelectStyle: CSSProperties = {
  ...selectStyle,
  width: '100%',
};

const helperTextStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--color-text-secondary)',
  letterSpacing: '-0.25px',
  padding: '8px 10px',
  borderRadius: 'var(--radius-input)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-secondary)',
};

function DateBetweenInput({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  const isDynamic = value?.dynamic === true;
  const mode: 'fixed' | 'dynamic' = isDynamic ? 'dynamic' : 'fixed';

  // For custom period UI state (display units, not normalized)
  const customDirection = value?.direction || 'next';
  const customNumber = value?.number || 7;
  const customUnit = value?.unit || 'days';

  const handleModeChange = (m: string) => {
    if (m === 'dynamic') {
      onChange({ dynamic: true, preset: 'this_month' });
    } else {
      onChange({ from: '', to: '' });
    }
  };

  const handlePresetChange = (preset: DynamicPreset) => {
    if (preset === 'custom_period') {
      onChange({
        dynamic: true,
        preset: 'custom_period',
        direction: 'next',
        number: 7,
        unit: 'days',
      });
    } else {
      onChange({ dynamic: true, preset });
    }
  };

  const toDaysMultiplier = (unit: string) =>
    unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;

  // Local YYYY-MM-DD formatter (avoids UTC shift from toISOString)
  const fmtLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Resolve the current dynamic preset for the helper text
  const resolvedRange = isDynamic
    ? (() => {
        if (value.preset === 'custom_period') {
          const days = (value.number || 7) * toDaysMultiplier(value.unit || 'days');
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (value.direction === 'next') {
            const end = new Date(today);
            end.setDate(end.getDate() + days - 1);
            return { $gte: fmtLocal(today), $lte: fmtLocal(end) };
          } else {
            const start = new Date(today);
            start.setDate(start.getDate() - (days - 1));
            return { $gte: fmtLocal(start), $lte: fmtLocal(today) };
          }
        }
        return resolveDynamicPreset(value.preset || 'this_month');
      })()
    : null;

  if (mode === 'fixed') {
    const rangeVal = (value || {}) as { from?: string; to?: string };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <RadioGroup
          options={[
            { label: 'Fixed', value: 'fixed' },
            { label: 'Dynamic', value: 'dynamic' },
          ]}
          value="fixed"
          onChange={handleModeChange}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            value={rangeVal.from || ''}
            onChange={(e) => onChange({ ...rangeVal, from: e.target.value })}
            style={{ ...inputStyle, width: '180px' }}
            {...focusHandlers}
          />
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', flexShrink: 0 }}>to</span>
          <input
            type="date"
            value={rangeVal.to || ''}
            onChange={(e) => onChange({ ...rangeVal, to: e.target.value })}
            style={{ ...inputStyle, width: '180px' }}
            {...focusHandlers}
          />
        </div>
      </div>
    );
  }

  // Dynamic mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <RadioGroup
        options={[
          { label: 'Fixed', value: 'fixed' },
          { label: 'Dynamic', value: 'dynamic' },
        ]}
        value="dynamic"
        onChange={handleModeChange}
      />
      <select
        value={value.preset || 'this_month'}
        onChange={(e) => handlePresetChange(e.target.value as DynamicPreset)}
        style={{ ...presetSelectStyle, maxWidth: '260px' }}
        {...focusHandlers}
      >
        {PRESET_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.presets.map((preset) => (
              <option key={preset} value={preset}>
                {DYNAMIC_PRESET_LABELS[preset]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {value.preset === 'custom_period' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select
            value={customDirection}
            onChange={(e) =>
              onChange({ ...value, direction: e.target.value })
            }
            style={{ ...presetSelectStyle, width: '120px' }}
          >
            <option value="this">Last</option>
            <option value="next">Next</option>
          </select>
          <input
            type="number"
            min={1}
            value={customNumber}
            onChange={(e) =>
              onChange({ ...value, number: Math.max(1, parseInt(e.target.value) || 1) })
            }
            style={{
              ...inputStyle,
              width: '80px',
              textAlign: 'center',
            }}
          />
          <select
            value={customUnit}
            onChange={(e) =>
              onChange({ ...value, unit: e.target.value })
            }
            style={{ ...presetSelectStyle, width: '120px' }}
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
      )}

      {resolvedRange && (
        <div style={helperTextStyle}>
          Currently: {formatDateDisplay(resolvedRange.$gte)} – {formatDateDisplay(resolvedRange.$lte)}
        </div>
      )}
    </div>
  );
}

// ── Date Single with Fixed/Dynamic toggle (for $gte / $lte) ─────────

function DateSingleInput({
  operator,
  value,
  onChange,
}: {
  operator: '$gte' | '$lte';
  value: any;
  onChange: (v: any) => void;
}) {
  const isDynamic = value?.dynamic === true;
  const mode: 'fixed' | 'dynamic' = isDynamic ? 'dynamic' : 'fixed';

  const customDirection = value?.direction || 'next';
  const customNumber = value?.number || 7;
  const customUnit = value?.unit || 'days';

  const handleModeChange = (m: string) => {
    if (m === 'dynamic') {
      onChange({ dynamic: true, preset: 'today' });
    } else {
      onChange('');
    }
  };

  const handlePresetChange = (preset: DynamicPreset) => {
    if (preset === 'custom_period') {
      onChange({
        dynamic: true,
        preset: 'custom_period',
        direction: 'next',
        number: 7,
        unit: 'days',
      });
    } else {
      onChange({ dynamic: true, preset });
    }
  };

  const toDaysMultiplier = (unit: string) =>
    unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;

  const fmtLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Resolve dynamic preset to show the relevant single date
  const resolvedDate = isDynamic
    ? (() => {
        let range: { $gte: string; $lte: string };
        if (value.preset === 'custom_period') {
          const days = (value.number || 7) * toDaysMultiplier(value.unit || 'days');
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (value.direction === 'next') {
            const end = new Date(today);
            end.setDate(end.getDate() + days - 1);
            range = { $gte: fmtLocal(today), $lte: fmtLocal(end) };
          } else {
            const start = new Date(today);
            start.setDate(start.getDate() - (days - 1));
            range = { $gte: fmtLocal(start), $lte: fmtLocal(today) };
          }
        } else {
          range = resolveDynamicPreset(value.preset || 'today');
        }
        // $gte → use start of range, $lte → use end of range
        return operator === '$gte' ? range.$gte : range.$lte;
      })()
    : null;

  if (mode === 'fixed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <RadioGroup
          options={[
            { label: 'Fixed', value: 'fixed' },
            { label: 'Dynamic', value: 'dynamic' },
          ]}
          value="fixed"
          onChange={handleModeChange}
        />
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, width: '180px' }}
          {...focusHandlers}
        />
      </div>
    );
  }

  // Dynamic mode
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <RadioGroup
        options={[
          { label: 'Fixed', value: 'fixed' },
          { label: 'Dynamic', value: 'dynamic' },
        ]}
        value="dynamic"
        onChange={handleModeChange}
      />
      <select
        value={value.preset || 'today'}
        onChange={(e) => handlePresetChange(e.target.value as DynamicPreset)}
        style={{ ...presetSelectStyle, maxWidth: '260px' }}
        {...focusHandlers}
      >
        {PRESET_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.presets.map((preset) => (
              <option key={preset} value={preset}>
                {DYNAMIC_PRESET_LABELS[preset]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {value.preset === 'custom_period' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <select
            value={customDirection}
            onChange={(e) =>
              onChange({ ...value, direction: e.target.value })
            }
            style={{ ...presetSelectStyle, width: '120px' }}
          >
            <option value="this">Last</option>
            <option value="next">Next</option>
          </select>
          <input
            type="number"
            min={1}
            value={customNumber}
            onChange={(e) =>
              onChange({ ...value, number: Math.max(1, parseInt(e.target.value) || 1) })
            }
            style={{
              ...inputStyle,
              width: '80px',
              textAlign: 'center',
            }}
          />
          <select
            value={customUnit}
            onChange={(e) =>
              onChange({ ...value, unit: e.target.value })
            }
            style={{ ...presetSelectStyle, width: '120px' }}
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
      )}

      {resolvedDate && (
        <div style={helperTextStyle}>
          Currently: {operator === '$gte' ? 'on or after' : 'on or before'} {formatDateDisplay(resolvedDate)}
        </div>
      )}
    </div>
  );
}

// ── Main ValueInput ─────────────────────────────────────────────────

export default function ValueInput({ fieldKey, operator, value, onChange }: ValueInputProps) {
  const fieldEntry = getFieldEntry(fieldKey);
  if (!fieldEntry) return null;

  const { fieldType, options, searchEndpoint } = fieldEntry;

  // Boolean fields → Yes/No toggle
  if (fieldType === 'boolean') {
    return (
      <RadioGroup
        options={[
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ]}
        value={value === true || value === 'true' ? 'true' : 'false'}
        onChange={(v) => onChange(v === 'true')}
      />
    );
  }

  // Enum + $in/$nin → multi-select checkbox dropdown
  if (fieldType === 'enum' && (operator === '$in' || operator === '$nin') && options) {
    const arrVal = Array.isArray(value) ? value : [];
    return <MultiSelectDropdown options={options} value={arrVal} onChange={onChange} />;
  }

  // Enum + $eq → single select
  if (fieldType === 'enum' && options) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...selectStyle, width: '100%' }}
        {...focusHandlers}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // Search fields → search + select with API
  if (fieldType === 'search' && searchEndpoint) {
    const arrVal = Array.isArray(value) ? value : [];
    return <SearchSelectInput endpoint={searchEndpoint} value={arrVal} onChange={onChange} />;
  }

  // Multi-enum (tags) → freeform tag input
  if (fieldType === 'multi-enum') {
    const arrVal = Array.isArray(value) ? value : [];
    return <TagInput value={arrVal} onChange={onChange} endpoint={searchEndpoint} />;
  }

  // Number fields → number input
  if (fieldType === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' : Number(v));
        }}
        placeholder="Enter value..."
        style={{ ...inputStyle, width: '100%' }}
        {...focusHandlers}
      />
    );
  }

  // Date fields → date range (between) or single date with optional dynamic
  if (fieldType === 'date') {
    if (operator === '$between') {
      return <DateBetweenInput value={value} onChange={onChange} />;
    }
    if (operator === '$gte' || operator === '$lte') {
      return <DateSingleInput operator={operator} value={value} onChange={onChange} />;
    }
    return (
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, width: '180px' }}
        {...focusHandlers}
      />
    );
  }

  // String fields → text input
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={operator === '$regex' ? 'Contains...' : 'Enter value...'}
      style={{ ...inputStyle, width: '100%' }}
      {...focusHandlers}
    />
  );
}
