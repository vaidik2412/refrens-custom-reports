import { getFieldEntry } from './field-registry';
import type { AIFilterInstruction } from '@/types/ai-report';
import type { QueryCondition, QueryGroup, Operator } from '@/types/query-builder';

/**
 * Infer the operator and unwrap the value from an AI filter instruction
 * into the shape the ConditionRow/ValueInput components expect.
 */
function unwrapFilter(
  key: string,
  rawValue: any
): { operator: Operator; value: any } | null {
  const entry = getFieldEntry(key);
  if (!entry) return null;

  const { fieldType } = entry;

  // Boolean — always $eq
  if (fieldType === 'boolean') {
    return { operator: '$eq', value: rawValue };
  }

  // Enum — detect $in/$nin or plain $eq
  if (fieldType === 'enum') {
    if (typeof rawValue === 'object' && rawValue !== null) {
      if (rawValue.$in) return { operator: '$in', value: rawValue.$in };
      if (rawValue.$nin) return { operator: '$nin', value: rawValue.$nin };
    }
    // Coerce booleans to strings so <select value="true"> matches <option value="true">
    const val = typeof rawValue === 'boolean' ? String(rawValue) : rawValue;
    return { operator: '$eq', value: val };
  }

  // Number — detect comparison operators or plain $eq
  if (fieldType === 'number') {
    if (typeof rawValue === 'object' && rawValue !== null) {
      // Pick the first comparison operator found
      for (const op of ['$gte', '$gt', '$lte', '$lt'] as Operator[]) {
        if (rawValue[op] !== undefined) {
          return { operator: op, value: rawValue[op] };
        }
      }
    }
    return { operator: '$eq', value: rawValue };
  }

  // Date — detect $dynamic preset, $between (has both $gte and $lte), or single-sided
  if (fieldType === 'date') {
    if (typeof rawValue === 'object' && rawValue !== null) {
      // Dynamic preset → DateBetweenInput expects { dynamic: true, preset: "..." }
      if (rawValue.$dynamic) {
        return { operator: '$between', value: { dynamic: true, preset: rawValue.$dynamic } };
      }
      if (rawValue.$gte && rawValue.$lte) {
        // $between → DateBetweenInput expects { from, to }
        return { operator: '$between', value: { from: rawValue.$gte, to: rawValue.$lte } };
      }
      if (rawValue.$gte) return { operator: '$gte', value: rawValue.$gte };
      if (rawValue.$lte) return { operator: '$lte', value: rawValue.$lte };
    }
    return { operator: '$between', value: rawValue };
  }

  // Search (client) — extract the names array
  if (fieldType === 'search') {
    if (typeof rawValue === 'object' && rawValue?.$in) {
      return { operator: '$in', value: rawValue.$in };
    }
    return { operator: '$in', value: Array.isArray(rawValue) ? rawValue : [rawValue] };
  }

  // Multi-enum (tags) — extract the array
  if (fieldType === 'multi-enum') {
    if (typeof rawValue === 'object' && rawValue !== null) {
      if (rawValue.$all) return { operator: '$all', value: rawValue.$all };
      if (rawValue.$in) return { operator: '$in', value: rawValue.$in };
    }
    return { operator: '$all', value: Array.isArray(rawValue) ? rawValue : [rawValue] };
  }

  // String — detect $regex or $eq
  if (fieldType === 'string') {
    if (typeof rawValue === 'object' && rawValue?.$regex) {
      return { operator: '$regex', value: rawValue.$regex };
    }
    if (typeof rawValue === 'object' && rawValue?.$in) {
      return { operator: '$in' as Operator, value: rawValue.$in };
    }
    return { operator: '$eq', value: rawValue };
  }

  return { operator: '$eq', value: rawValue };
}

/**
 * Convert an array of AI filter instructions into a QueryGroup
 * that the ConditionList component can render and edit.
 *
 * Skips `billType` since that's handled separately by BillTypeStep.
 */
export function aiFiltersToQueryGroup(filters: AIFilterInstruction[]): QueryGroup {
  const conditions: QueryCondition[] = [];

  for (const filter of filters) {
    // Skip billType — it's handled by the BillTypeStep dropdown
    if (filter.key === 'billType') continue;

    const unwrapped = unwrapFilter(filter.key, filter.value);
    if (!unwrapped) continue;

    conditions.push({
      id: crypto.randomUUID(),
      field: filter.key,
      operator: unwrapped.operator,
      value: unwrapped.value,
    });
  }

  return {
    id: crypto.randomUUID(),
    logicalOperator: 'AND',
    conditions,
    groups: [],
  };
}
