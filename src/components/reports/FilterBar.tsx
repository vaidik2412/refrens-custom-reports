'use client';

import { CSSProperties, useState } from 'react';
import SelectFilter from '@/components/filters/SelectFilter';
import MultiSelectFilter from '@/components/filters/MultiSelectFilter';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import NumberRangeFilter from '@/components/filters/NumberRangeFilter';
import BooleanFilter from '@/components/filters/BooleanFilter';
import SearchSelectFilter from '@/components/filters/SearchSelectFilter';
import { PRIMARY_FILTERS, SECONDARY_FILTERS } from '@/lib/constants';
import type { FilterFieldConfig } from '@/types';

interface FilterBarProps {
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  removeFilter: (key: string) => void;
}

const barStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: '16px',
  padding: '16px 0 12px',
};

const moreFiltersContainerStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  padding: '20px 0 8px',
  marginTop: '8px',
};

const moreFilterGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '18px 16px',
  alignItems: 'start',
};

const toggleBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: 'var(--height-button-sm)',
  padding: '0 12px',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-card)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  alignSelf: 'flex-end',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
  transition: 'border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease',
};

function renderFilter(
  config: FilterFieldConfig,
  filters: Record<string, any>,
  setFilter: (key: string, value: any) => void,
  removeFilter: (key: string) => void
) {
  const val = filters[config.key];

  switch (config.type) {
    case 'select':
      return (
        <SelectFilter
          key={config.key}
          label={config.label}
          value={val}
          options={config.options || []}
          onChange={(v) => (v !== undefined ? setFilter(config.key, v) : removeFilter(config.key))}
          placeholder={config.placeholder}
        />
      );

    case 'multi-select': {
      const operator =
        typeof val === 'object' && val !== null
          ? ('$all' in val ? '$all' : '$nin' in val ? '$nin' : '$in' in val ? '$in' : config.operator || '$in')
          : config.operator || '$in';
      const operatorOptions =
        config.key === 'tags'
          ? [
              { label: 'Any of', value: '$in' as const },
              { label: 'All of', value: '$all' as const },
            ]
          : undefined;
      const shouldPersistEmptySelection = Boolean(operatorOptions?.length);
      return (
        <MultiSelectFilter
          key={config.key}
          label={config.label}
          value={val?.[operator] || val?.$nin || val || []}
          options={config.options}
          onChange={(v) =>
            v.length > 0 || shouldPersistEmptySelection
              ? setFilter(config.key, { [operator]: v })
              : removeFilter(config.key)
          }
          placeholder={config.placeholder}
          allowFreeText={config.key === 'tags'}
          searchEndpoint={config.searchEndpoint}
          operator={operator}
          operatorOptions={operatorOptions}
          onOperatorChange={(nextOperator) => {
            const selectedValues = val?.$all || val?.$nin || val?.$in || [];
            setFilter(config.key, { [nextOperator]: selectedValues });
          }}
        />
      );
    }

    case 'date-range':
      return (
        <DateRangeFilter
          key={config.key}
          label={config.label}
          value={val}
          onChange={(v) => (v ? setFilter(config.key, v) : removeFilter(config.key))}
        />
      );

    case 'number-range':
      return (
        <NumberRangeFilter
          key={config.key}
          label={config.label}
          value={val}
          onChange={(v) => (v ? setFilter(config.key, v) : removeFilter(config.key))}
        />
      );

    case 'boolean':
      return (
        <BooleanFilter
          key={config.key}
          label={config.label}
          value={val}
          onChange={(v) => (v !== undefined ? setFilter(config.key, v) : removeFilter(config.key))}
        />
      );

    case 'search-select':
      return (
        <SearchSelectFilter
          key={config.key}
          label={config.label}
          value={val}
          onChange={(v) => (v ? setFilter(config.key, v) : removeFilter(config.key))}
          searchEndpoint={config.searchEndpoint || '/api/clients/search'}
          placeholder={config.placeholder}
        />
      );

    default:
      return null;
  }
}

export default function FilterBar({ filters, setFilter, removeFilter }: FilterBarProps) {
  const [showMore, setShowMore] = useState(false);

  // Count active secondary filters
  const activeSecondaryCount = SECONDARY_FILTERS.filter(
    (f) => filters[f.key] !== undefined
  ).length;

  return (
    <div>
      <div style={barStyle}>
        {PRIMARY_FILTERS.map((config) =>
          renderFilter(config, filters, setFilter, removeFilter)
        )}
        <button
          style={{
            ...toggleBtnStyle,
            borderColor:
              showMore || activeSecondaryCount > 0
                ? 'var(--color-border-input-focus)'
                : 'var(--color-border-strong)',
            color:
              showMore || activeSecondaryCount > 0
                ? 'var(--color-cta-primary)'
                : 'var(--color-text-primary)',
            boxShadow:
              showMore || activeSecondaryCount > 0
                ? 'var(--shadow-focus)'
                : toggleBtnStyle.boxShadow,
          }}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Less Filters' : 'More Filters'}
          {activeSecondaryCount > 0 && (
            <span
              style={{
                background: 'var(--color-cta-primary)',
                color: 'var(--color-bg-card)',
                borderRadius: '999px',
                padding: '1px 8px',
                fontSize: '11px',
                fontWeight: 600,
                marginLeft: '2px',
              }}
            >
              {activeSecondaryCount}
            </span>
          )}
        </button>
      </div>
      {showMore && (
        <div style={moreFiltersContainerStyle}>
          <div style={moreFilterGridStyle}>
            {SECONDARY_FILTERS.map((config) =>
              renderFilter(config, filters, setFilter, removeFilter)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
