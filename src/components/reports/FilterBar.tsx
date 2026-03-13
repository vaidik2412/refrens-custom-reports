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
  gap: '12px',
  padding: '12px 0',
};

const moreFiltersContainerStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  padding: '16px 0 8px',
  marginTop: '4px',
};

const moreFilterGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '16px',
  alignItems: 'start',
};

const toggleBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-input)',
  fontSize: '13px',
  color: 'var(--color-text-secondary)',
  background: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.25px',
  alignSelf: 'flex-end',
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

    case 'multi-select':
      return (
        <MultiSelectFilter
          key={config.key}
          label={config.label}
          value={val?.$in || val || []}
          options={config.options}
          onChange={(v) => (v.length > 0 ? setFilter(config.key, { $in: v }) : removeFilter(config.key))}
          placeholder={config.placeholder}
          allowFreeText={config.key === 'tags'}
        />
      );

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
          searchEndpoint="/api/clients/search"
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
            borderColor: showMore || activeSecondaryCount > 0 ? 'var(--color-cta-primary)' : 'var(--color-border)',
            color: showMore || activeSecondaryCount > 0 ? 'var(--color-cta-primary)' : 'var(--color-text-secondary)',
          }}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'Less Filters' : 'More Filters'}
          {activeSecondaryCount > 0 && (
            <span
              style={{
                background: 'var(--color-cta-primary)',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '1px 7px',
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
