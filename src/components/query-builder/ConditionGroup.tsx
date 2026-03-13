'use client';

import { CSSProperties, useMemo } from 'react';
import ConditionRow from './ConditionRow';
import LogicalOperatorToggle from './LogicalOperatorToggle';
import Button from '@/components/ui/Button';
import type { QueryCondition, QueryGroup, LogicalOperator } from '@/types/query-builder';

interface ConditionGroupProps {
  group: QueryGroup;
  onUpdate: (group: QueryGroup) => void;
  onRemove: () => void;
  billType: string | null;
}

const groupContainerStyle: CSSProperties = {
  borderLeft: '3px solid var(--color-cta-primary)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-secondary, #F9FAFB)',
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
  borderRadius: '6px',
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

  return (
    <div style={groupContainerStyle}>
      <div style={groupHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={groupLabelStyle}>Group</span>
          <LogicalOperatorToggle
            value={group.logicalOperator}
            onChange={toggleOperator}
          />
        </div>
        <button
          type="button"
          style={removeBtnStyle}
          onClick={onRemove}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
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
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-cta-primary)',
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
