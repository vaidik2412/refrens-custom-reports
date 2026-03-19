'use client';

import { CSSProperties } from 'react';
import { getFieldEntry, OPERATOR_LABELS, DATE_OPERATOR_LABELS } from '@/lib/field-registry';
import type { Operator } from '@/types/query-builder';

interface OperatorPickerProps {
  fieldKey: string;
  value: Operator;
  onChange: (operator: Operator) => void;
  /** When true, relabels "$between" to "is in" for dynamic date presets */
  dynamicDate?: boolean;
}

const selectStyle: CSSProperties = {
  padding: '6px 10px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-input)',
  background: 'var(--color-bg-card)',
  fontSize: '13px',
  fontWeight: 400,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  letterSpacing: '-0.25px',
  outline: 'none',
  minWidth: '120px',
};

export default function OperatorPicker({ fieldKey, value, onChange, dynamicDate }: OperatorPickerProps) {
  const fieldEntry = getFieldEntry(fieldKey);
  if (!fieldEntry) return null;

  const operators = fieldEntry.operators;
  const isDate = fieldEntry.fieldType === 'date';

  const getLabel = (op: Operator) => {
    // Relabel $between → "is in" when dynamic date is active
    if (dynamicDate && op === '$between') return 'is in';
    return isDate
      ? DATE_OPERATOR_LABELS[op] || OPERATOR_LABELS[op]
      : OPERATOR_LABELS[op];
  };

  // If only one operator, render as static text
  if (operators.length === 1) {
    return (
      <span
        style={{
          ...selectStyle,
          border: '1px solid var(--color-border)',
          cursor: 'default',
          color: 'var(--color-text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {getLabel(operators[0]) || operators[0]}
      </span>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Operator)}
      style={selectStyle}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--color-cta-primary)';
        e.target.style.boxShadow = 'var(--shadow-focus)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--color-border-input)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {operators.map((op) => (
        <option key={op} value={op}>
          {getLabel(op) || op}
        </option>
      ))}
    </select>
  );
}
