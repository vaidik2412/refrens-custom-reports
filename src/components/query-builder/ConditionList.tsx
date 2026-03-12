'use client';

import { CSSProperties, useMemo } from 'react';
import ConditionRow from './ConditionRow';
import Button from '@/components/ui/Button';
import type { QueryCondition, QueryGroup } from '@/types/query-builder';

interface ConditionListProps {
  group: QueryGroup;
  onUpdate: (group: QueryGroup) => void;
  billType: string | null;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '4px',
};

const titleStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  letterSpacing: '-0.25px',
};

const emptyStyle: CSSProperties = {
  padding: '24px',
  textAlign: 'center',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-input)',
  color: 'var(--color-text-secondary)',
  fontSize: '13px',
};

export default function ConditionList({ group, onUpdate, billType }: ConditionListProps) {
  const usedFields = useMemo(
    () => group.conditions.map((c) => c.field).filter(Boolean),
    [group.conditions]
  );

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: crypto.randomUUID(),
      field: '',
      operator: '$eq',
      value: undefined,
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    onUpdate({
      ...group,
      conditions: group.conditions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCondition = (id: string) => {
    onUpdate({
      ...group,
      conditions: group.conditions.filter((c) => c.id !== id),
    });
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>
          Filters{group.conditions.length > 0 ? ` (${group.conditions.length})` : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={addCondition}>
          + Add filter
        </Button>
      </div>

      {group.conditions.length === 0 ? (
        <div style={emptyStyle}>
          No filters added yet. Click &ldquo;+ Add filter&rdquo; to start building your query.
        </div>
      ) : (
        group.conditions.map((condition) => (
          <ConditionRow
            key={condition.id}
            condition={condition}
            onUpdate={updateCondition}
            onRemove={removeCondition}
            usedFields={usedFields}
            billType={billType}
          />
        ))
      )}
    </div>
  );
}
