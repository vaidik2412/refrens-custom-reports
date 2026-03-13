'use client';

import { CSSProperties } from 'react';
import type { LogicalOperator } from '@/types/query-builder';

interface LogicalOperatorToggleProps {
  value: LogicalOperator;
  onChange: (value: LogicalOperator) => void;
}

const containerStyle: CSSProperties = {
  display: 'inline-flex',
  borderRadius: '6px',
  overflow: 'hidden',
  border: '1px solid var(--color-border)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

function pillStyle(active: boolean): CSSProperties {
  return {
    padding: '3px 10px',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--color-cta-primary)' : '#FFFFFF',
    color: active ? '#FFFFFF' : 'var(--color-text-secondary)',
    transition: 'background 0.15s, color 0.15s',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  };
}

export default function LogicalOperatorToggle({ value, onChange }: LogicalOperatorToggleProps) {
  return (
    <div style={containerStyle}>
      <button
        type="button"
        style={pillStyle(value === 'AND')}
        onClick={() => onChange('AND')}
      >
        AND
      </button>
      <button
        type="button"
        style={pillStyle(value === 'OR')}
        onClick={() => onChange('OR')}
      >
        OR
      </button>
    </div>
  );
}
