'use client';

import { CSSProperties, useMemo } from 'react';
import ConditionRow from './ConditionRow';
import ConditionGroup from './ConditionGroup';
import LogicalOperatorToggle from './LogicalOperatorToggle';
import Button from '@/components/ui/Button';
import type { QueryCondition, QueryGroup, LogicalOperator } from '@/types/query-builder';
import { detectWarnings } from '@/lib/condition-warnings';

interface ConditionListProps {
  group: QueryGroup;
  onUpdate: (group: QueryGroup) => void;
  billType: string | null;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '4px',
};

const titleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--color-text-label)',
  letterSpacing: '-0.25px',
};

const emptyStyle: CSSProperties = {
  padding: '28px 24px',
  textAlign: 'center',
  border: '1px dashed var(--color-border-subtle)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-secondary)',
  color: 'var(--color-text-secondary)',
  fontSize: '13px',
  lineHeight: '20px',
};

const connectorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '4px 0',
};

const connectorLineStyle: CSSProperties = {
  flex: 1,
  height: 0,
  borderTop: '1px solid var(--color-border)',
};

const connectorLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px 8px',
  borderRadius: 'var(--radius-tag)',
  border: '1px solid var(--color-chip-border)',
  background: 'var(--color-chip-bg)',
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--color-chip-text)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  flexShrink: 0,
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export default function ConditionList({ group, onUpdate, billType }: ConditionListProps) {
  const usedFields = useMemo(
    () => group.conditions.map((c) => c.field).filter(Boolean),
    [group.conditions]
  );

  const groups = group.groups || [];
  const totalItems = group.conditions.length + groups.length;

  const warnings = useMemo(
    () => detectWarnings(group.conditions, group.logicalOperator),
    [group.conditions, group.logicalOperator]
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

  const addGroup = () => {
    const newGroup: QueryGroup = {
      id: crypto.randomUUID(),
      logicalOperator: 'AND',
      conditions: [],
      groups: [],
    };
    onUpdate({
      ...group,
      groups: [...groups, newGroup],
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

  const updateSubGroup = (id: string, updatedGroup: QueryGroup) => {
    onUpdate({
      ...group,
      groups: groups.map((g) => (g.id === id ? updatedGroup : g)),
    });
  };

  const removeSubGroup = (id: string) => {
    onUpdate({
      ...group,
      groups: groups.filter((g) => g.id !== id),
    });
  };

  const toggleRootOperator = (op: LogicalOperator) => {
    onUpdate({ ...group, logicalOperator: op });
  };

  // Build interleaved list: conditions first, then groups, with connector labels between
  const items: Array<{ type: 'condition'; condition: QueryCondition } | { type: 'group'; group: QueryGroup }> = [
    ...group.conditions.map((c) => ({ type: 'condition' as const, condition: c })),
    ...groups.map((g) => ({ type: 'group' as const, group: g })),
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={titleStyle}>
            Filters{totalItems > 0 ? ` (${totalItems})` : ''}
          </span>
          {totalItems > 1 && (
            <LogicalOperatorToggle
              value={group.logicalOperator}
              onChange={toggleRootOperator}
            />
          )}
        </div>
        <div style={actionsStyle}>
          {groups.length === 0 && (
            <Button variant="ghost" size="sm" onClick={addCondition}>
              + Add filter
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={addGroup}>
            + Add group
          </Button>
        </div>
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

      {totalItems === 0 ? (
        <div style={emptyStyle}>
          No filters added yet. Click &ldquo;+ Add filter&rdquo; to start building your query,
          or &ldquo;+ Add group&rdquo; to create a group of conditions.
        </div>
      ) : (
        items.map((item, index) => (
          <div key={item.type === 'condition' ? item.condition.id : item.group.id}>
            {index > 0 && (
              <div style={connectorStyle}>
                <div style={connectorLineStyle} />
                <span style={connectorLabelStyle}>{group.logicalOperator}</span>
                <div style={connectorLineStyle} />
              </div>
            )}
            {item.type === 'condition' ? (
              <ConditionRow
                condition={item.condition}
                onUpdate={updateCondition}
                onRemove={removeCondition}
                usedFields={usedFields}
                billType={billType}
              />
            ) : (
              <ConditionGroup
                group={item.group}
                onUpdate={(updated) => updateSubGroup(item.group.id, updated)}
                onRemove={() => removeSubGroup(item.group.id)}
                billType={billType}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
