'use client';

import { CSSProperties, useMemo } from 'react';
import ConditionRow from './ConditionRow';
import LogicalOperatorToggle from './LogicalOperatorToggle';
import Button from '@/components/ui/Button';
import type { QueryCondition, QueryGroup, LogicalOperator } from '@/types/query-builder';
import { detectWarnings } from '@/lib/condition-warnings';

interface ConditionGroupProps {
  group: QueryGroup;
  onUpdate: (group: QueryGroup) => void;
  onRemove: () => void;
  billType: string | null;
}

const groupContainerStyle: CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-secondary)',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const groupHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const groupLabelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const removeBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  border: 'none',
  background: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  borderRadius: 'var(--radius-tag)',
  fontSize: '13px',
  transition: 'background 0.15s, color 0.15s',
  flexShrink: 0,
};

const emptyStyle: CSSProperties = {
  padding: '16px',
  textAlign: 'center',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-input)',
  color: 'var(--color-text-secondary)',
  fontSize: '13px',
};

export default function ConditionGroup({ group, onUpdate, onRemove, billType }: ConditionGroupProps) {
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

  const toggleOperator = (op: LogicalOperator) => {
    onUpdate({ ...group, logicalOperator: op });
  };

  const warnings = useMemo(
    () => detectWarnings(group.conditions, group.logicalOperator),
    [group.conditions, group.logicalOperator]
  );

  return (
    <div style={groupContainerStyle}>
      <div style={groupHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={groupLabelStyle}>Group</span>
          <LogicalOperatorToggle
            value={group.logicalOperator}
            onChange={toggleOperator}
            variant="nested"
          />
        </div>
        <button
          type="button"
          style={removeBtnStyle}
          onClick={onRemove}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-error-hover-bg)';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
          }}
          aria-label="Remove group"
        >
          &#x2715;
        </button>
      </div>

      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-tag)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '-0.2px',
                background: w.type === 'contradiction'
                  ? 'var(--color-error-hover-bg, #FEF2F2)'
                  : 'var(--color-warning-bg, #FFFBEB)',
                color: w.type === 'contradiction'
                  ? 'var(--color-error, #DC2626)'
                  : 'var(--color-warning-text, #92400E)',
              }}
            >
              <span>{w.type === 'contradiction' ? '⚠' : 'ℹ'}</span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {group.conditions.length === 0 ? (
        <div style={emptyStyle}>
          No filters in this group. Add one below.
        </div>
      ) : (
        group.conditions.map((condition, index) => (
          <div key={condition.id}>
            {index > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2px 0',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--color-chip-text)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                {group.logicalOperator}
              </div>
            )}
            <ConditionRow
              condition={condition}
              onUpdate={updateCondition}
              onRemove={removeCondition}
              usedFields={usedFields}
              billType={billType}
            />
          </div>
        ))
      )}

      <div>
        <Button variant="ghost" size="sm" onClick={addCondition}>
          + Add filter
        </Button>
      </div>
    </div>
  );
}
