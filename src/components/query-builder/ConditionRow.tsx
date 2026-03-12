'use client';

import { CSSProperties } from 'react';
import FieldPicker from './FieldPicker';
import OperatorPicker from './OperatorPicker';
import ValueInput from './ValueInput';
import { getFieldEntry } from '@/lib/field-registry';
import type { QueryCondition, Operator } from '@/types/query-builder';

interface ConditionRowProps {
  condition: QueryCondition;
  onUpdate: (id: string, updates: Partial<QueryCondition>) => void;
  onRemove: (id: string) => void;
  usedFields: string[];
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: '10px 12px',
  background: '#FFFFFF',
  borderRadius: 'var(--radius-input)',
  border: '1px solid var(--color-border)',
};

const removeBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  border: 'none',
  background: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'background 0.15s, color 0.15s',
  flexShrink: 0,
  marginTop: '2px',
};

export default function ConditionRow({ condition, onUpdate, onRemove, usedFields }: ConditionRowProps) {
  const handleFieldChange = (fieldKey: string) => {
    const entry = getFieldEntry(fieldKey);
    onUpdate(condition.id, {
      field: fieldKey,
      operator: entry?.defaultOperator || '$eq',
      value: entry?.fieldType === 'boolean' ? true : undefined,
    });
  };

  const handleOperatorChange = (operator: Operator) => {
    const entry = getFieldEntry(condition.field);
    const wasMulti = condition.operator === '$in';
    const isMulti = operator === '$in';
    const isDateField = entry?.fieldType === 'date';
    const dateOps = ['$between', '$gte', '$lte'];
    const wasDateOp = dateOps.includes(condition.operator);
    const isDateOp = dateOps.includes(operator);

    // Switching between date operators ($between, $gte, $lte):
    // preserve dynamic values (same shape), clear fixed values (different shapes)
    if (isDateField && wasDateOp && isDateOp && condition.value?.dynamic === true) {
      onUpdate(condition.id, { operator });
      return;
    }

    if (wasMulti !== isMulti || (wasDateOp !== isDateOp) || (isDateField && wasDateOp && isDateOp)) {
      // Clear value when switching operator types
      const newValue = isMulti
        ? (entry?.fieldType === 'boolean' ? undefined : [])
        : undefined;
      onUpdate(condition.id, { operator, value: newValue });
    } else {
      onUpdate(condition.id, { operator });
    }
  };

  return (
    <div style={rowStyle}>
      <FieldPicker
        value={condition.field}
        onChange={handleFieldChange}
        usedFields={usedFields}
      />

      {condition.field && (
        <OperatorPicker
          fieldKey={condition.field}
          value={condition.operator}
          onChange={handleOperatorChange}
          dynamicDate={condition.value?.dynamic === true}
        />
      )}

      {condition.field && (
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <ValueInput
            fieldKey={condition.field}
            operator={condition.operator}
            value={condition.value}
            onChange={(v) => onUpdate(condition.id, { value: v })}
          />
        </div>
      )}

      <button
        type="button"
        style={removeBtnStyle}
        onClick={() => onRemove(condition.id)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-error)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'none';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
        }}
        aria-label="Remove condition"
      >
        &#x2715;
      </button>
    </div>
  );
}
