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
  billType: string | null;
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '10px',
  padding: '12px',
  background: 'var(--color-bg-card)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border-strong)',
  boxShadow: '0 1px 2px rgba(20, 28, 39, 0.04)',
};

const removeBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  borderRadius: 'var(--radius-input)',
  fontSize: '12px',
  lineHeight: 1,
  transition: 'background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease',
  flexShrink: 0,
  marginLeft: 'auto',
};

export default function ConditionRow({ condition, onUpdate, onRemove, usedFields, billType }: ConditionRowProps) {
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
    const multiOperators: Operator[] = ['$in', '$nin', '$all'];
    const wasMulti = multiOperators.includes(condition.operator);
    const isMulti = multiOperators.includes(operator);
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
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <FieldPicker
          value={condition.field}
          onChange={handleFieldChange}
          usedFields={usedFields}
          billType={billType}
        />
      </div>

      {condition.field && (
        <div style={{ flex: '0 0 auto' }}>
          <OperatorPicker
            fieldKey={condition.field}
            value={condition.operator}
            onChange={handleOperatorChange}
            dynamicDate={condition.value?.dynamic === true}
          />
        </div>
      )}

      {condition.field && (
      <div style={{ flex: '1.5 1 200px', minWidth: 0 }}>
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
          (e.currentTarget as HTMLElement).style.background = 'var(--color-error-hover-bg)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239, 68, 68, 0.2)';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-error)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
        }}
        aria-label="Remove condition"
      >
        &#x2715;
      </button>
    </div>
  );
}
