'use client';

import { CSSProperties } from 'react';
import Pill from '@/components/ui/Pill';
import { getFilterLabel, formatFilterValue } from '@/lib/constants';

interface AppliedFiltersPillsProps {
  filters: Record<string, any>;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 0',
};

const clearAllStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '12px',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  padding: '4px 8px',
  textDecoration: 'underline',
  letterSpacing: '-0.25px',
};

// Keys that are internal / not user-facing filters
const HIDDEN_KEYS = ['isRemoved', 'isHardRemoved'];

function hasVisibleFilterValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((nestedValue) => {
      if (nestedValue === null || nestedValue === undefined || nestedValue === '') return false;
      if (Array.isArray(nestedValue)) return nestedValue.length > 0;
      return true;
    });
  }

  return true;
}

export default function AppliedFiltersPills({
  filters,
  removeFilter,
  clearFilters,
}: AppliedFiltersPillsProps) {
  const entries = Object.entries(filters).filter(
    ([key, value]) => !HIDDEN_KEYS.includes(key) && hasVisibleFilterValue(value)
  );

  if (entries.length === 0) return null;

  return (
    <div style={containerStyle}>
      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, marginRight: '4px' }}>
        Filters:
      </span>
      {entries.map(([key, value]) => (
        <Pill
          key={key}
          label={getFilterLabel(key)}
          value={formatFilterValue(key, value)}
          onRemove={() => removeFilter(key)}
          variant="brand"
        />
      ))}
      {entries.length > 1 && (
        <button style={clearAllStyle} onClick={clearFilters}>
          Clear all
        </button>
      )}
    </div>
  );
}
