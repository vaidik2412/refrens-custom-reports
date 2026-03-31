import { FIELD_REGISTRY } from './field-registry';
import { BILL_TYPE_OPTIONS } from './constants';
import type { AIFilterInstruction, AIReportResult } from '@/types/ai-report';

// All valid field keys (field registry + billType)
const VALID_KEYS = new Set([
  ...FIELD_REGISTRY.map((f) => f.key),
  'billType',
]);

const BILL_TYPE_VALUES = new Set(BILL_TYPE_OPTIONS.map((o) => o.value));

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// ── Per-filter validation ────────────────────────────────────────────

function validateFilter(filter: AIFilterInstruction): string | null {
  const { key, value } = filter;

  if (!VALID_KEYS.has(key)) {
    return `Unknown field key "${key}"`;
  }

  if (value === undefined || value === null) {
    return `Empty value for "${key}"`;
  }

  // billType special case
  if (key === 'billType') {
    const vals = typeof value === 'object' && value.$in ? value.$in : [value];
    for (const v of vals) {
      if (!BILL_TYPE_VALUES.has(v)) return `Invalid billType value "${v}"`;
    }
    return null;
  }

  const entry = FIELD_REGISTRY.find((f) => f.key === key);
  if (!entry) return null; // already checked VALID_KEYS

  // Validate enum values
  if (entry.fieldType === 'enum' && entry.options) {
    const allowed = new Set(entry.options.map((o) => o.value));
    if (typeof value === 'string') {
      if (!allowed.has(value)) return `Invalid value "${value}" for "${key}"`;
    } else if (typeof value === 'object') {
      const arr = value.$in || value.$nin || [];
      for (const v of arr) {
        if (!allowed.has(v)) return `Invalid value "${v}" for "${key}"`;
      }
    }
  }

  // Validate date format (allow $dynamic presets)
  if (entry.fieldType === 'date' && typeof value === 'object') {
    if (value.$dynamic) {
      const validPresets = new Set([
        'today', 'yesterday', 'last_7_days', 'last_15_days', 'last_30_days', 'last_45_days',
        'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year',
        'tomorrow', 'next_7_days', 'next_15_days', 'next_30_days', 'next_month', 'next_quarter', 'next_year',
        'custom_period',
      ]);
      if (!validPresets.has(value.$dynamic)) {
        return `Invalid dynamic preset "${value.$dynamic}" for "${key}"`;
      }
    } else {
      for (const op of ['$gte', '$lte']) {
        if (value[op] && !DATE_PATTERN.test(value[op])) {
          return `Invalid date format "${value[op]}" for "${key}" (expected YYYY-MM-DD)`;
        }
      }
    }
  }

  // Validate numbers
  if (entry.fieldType === 'number') {
    if (typeof value === 'object') {
      for (const op of ['$eq', '$gt', '$gte', '$lt', '$lte']) {
        if (value[op] !== undefined && typeof value[op] !== 'number') {
          return `Expected number for "${key}.${op}", got ${typeof value[op]}`;
        }
      }
    } else if (typeof value !== 'number') {
      return `Expected number for "${key}", got ${typeof value}`;
    }
  }

  // Validate boolean
  if (entry.fieldType === 'boolean' && typeof value !== 'boolean') {
    return `Expected boolean for "${key}", got ${typeof value}`;
  }

  return null;
}

// ── Main validator ───────────────────────────────────────────────────

export interface ValidationResult {
  result: AIReportResult;
  warnings: string[];
}

export function validateAIResponse(raw: any): ValidationResult {
  const warnings: string[] = [];

  // Handle error responses
  if (raw.success === false) {
    return {
      result: {
        success: false,
        error: raw.error || 'Unknown error from AI',
        suggestion: raw.suggestion,
      },
      warnings,
    };
  }

  // Must have filters array
  if (!Array.isArray(raw.filters)) {
    return {
      result: {
        success: false,
        error: 'AI returned an invalid response (no filters array)',
        suggestion: 'Try rephrasing your request.',
      },
      warnings: ['Response missing filters array'],
    };
  }

  // Validate each filter, keep valid ones
  const validFilters: AIFilterInstruction[] = [];
  for (const filter of raw.filters) {
    if (!filter || typeof filter.key !== 'string') {
      warnings.push('Skipped filter with missing key');
      continue;
    }
    const error = validateFilter(filter);
    if (error) {
      warnings.push(error);
    } else {
      validFilters.push({ key: filter.key, value: filter.value });
    }
  }

  // All filters invalid
  if (validFilters.length === 0 && raw.filters.length > 0) {
    return {
      result: {
        success: false,
        error: 'Could not map your request to valid filters.',
        suggestion: 'Try something like "unpaid invoices from last month in USD".',
      },
      warnings,
    };
  }

  return {
    result: {
      success: true,
      filters: validFilters,
      explanation: raw.explanation || 'Filters applied.',
      suggestedName: raw.suggestedName,
    },
    warnings,
  };
}
