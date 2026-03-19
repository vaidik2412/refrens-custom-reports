'use client';

import { CSSProperties } from 'react';
import type { LogicalOperator } from '@/types/query-builder';

interface LogicalOperatorToggleProps {
  value: LogicalOperator;
  onChange: (value: LogicalOperator) => void;
  /** "root" = solid filled (top-level), "nested" = outlined (sub-group) */
  variant?: 'root' | 'nested';
}

const baseContainerStyle: CSSProperties = {
  display: 'inline-flex',
  overflow: 'hidden',
  fontWeight: 600,
};

function getContainerStyle(variant: 'root' | 'nested'): CSSProperties {
  if (variant === 'nested') {
    return {
      ...baseContainerStyle,
      borderRadius: 'var(--radius-tag)',
      border: '1px solid var(--color-border-subtle)',
      fontSize: '10px',
      letterSpacing: '0.5px',
    };
  }
  return {
    ...baseContainerStyle,
    borderRadius: 'var(--radius-tag)',
    border: '1px solid var(--color-border)',
    fontSize: '11px',
    letterSpacing: '0.5px',
  };
}

function pillStyle(active: boolean, variant: 'root' | 'nested'): CSSProperties {
  if (variant === 'nested') {
    return {
      padding: '2px 8px',
      cursor: 'pointer',
      border: 'none',
      background: active ? 'var(--color-chip-bg)' : 'var(--color-bg-card)',
      color: active ? 'var(--color-chip-text)' : 'var(--color-text-secondary)',
      transition: 'background 0.15s, color 0.15s',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.5px',
    };
  }
  return {
    padding: '3px 10px',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--color-cta-primary)' : 'var(--color-bg-card)',
    color: active ? 'var(--color-bg-card)' : 'var(--color-text-secondary)',
    transition: 'background 0.15s, color 0.15s',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  };
}

export default function LogicalOperatorToggle({ value, onChange, variant = 'root' }: LogicalOperatorToggleProps) {
  return (
    <div style={getContainerStyle(variant)}>
      <button
        type="button"
        style={pillStyle(value === 'AND', variant)}
        onClick={() => onChange('AND')}
      >
        AND
      </button>
      <button
        type="button"
        style={pillStyle(value === 'OR', variant)}
        onClick={() => onChange('OR')}
      >
        OR
      </button>
    </div>
  );
}
