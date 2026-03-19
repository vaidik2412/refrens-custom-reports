import type { QueryCondition, LogicalOperator } from '@/types/query-builder';
import { FIELD_REGISTRY } from './field-registry';

export interface ConditionWarning {
  type: 'contradiction' | 'redundancy';
  message: string;
  conditionIds: string[];
}

/**
 * Detect contradictions and redundancies among sibling conditions
 * within the same logical group.
 *
 * Contradiction (AND): same field + $eq but different scalar values
 *   → impossible, will return 0 results.
 *
 * Redundancy (OR):
 *   a) same field + $eq + same value → duplicate, remove one.
 *   b) same field + $eq + values cover ALL enum options → matches everything.
 *
 * Duplicate (any operator): identical field+operator+value → always redundant.
 */
export function detectWarnings(
  conditions: QueryCondition[],
  logicalOperator: LogicalOperator
): ConditionWarning[] {
  const warnings: ConditionWarning[] = [];
  const registry = FIELD_REGISTRY;

  // Only analyse conditions that have a field and value set
  const filled = conditions.filter((c) => c.field && c.value !== undefined && c.value !== '');

  // Group by field key
  const byField = new Map<string, QueryCondition[]>();
  for (const c of filled) {
    const list = byField.get(c.field) || [];
    list.push(c);
    byField.set(c.field, list);
  }

  for (const [fieldKey, group] of byField) {
    if (group.length < 2) continue;

    const fieldDef = registry.find((f) => f.key === fieldKey);
    const fieldLabel = fieldDef?.label || fieldKey;

    // Only check $eq pairs — range operators ($gte, $lte, $between) are
    // legitimately used together and harder to reason about statically.
    const eqConditions = group.filter((c) => c.operator === '$eq');

    if (eqConditions.length >= 2) {
      // Collect distinct scalar values
      const valueSet = new Map<string, string[]>(); // serialised value → condition ids
      for (const c of eqConditions) {
        const key = JSON.stringify(c.value);
        const ids = valueSet.get(key) || [];
        ids.push(c.id);
        valueSet.set(key, ids);
      }

      const distinctValues = [...valueSet.keys()];

      if (logicalOperator === 'AND') {
        // AND with different $eq values on the same field → contradiction
        if (distinctValues.length > 1) {
          warnings.push({
            type: 'contradiction',
            message: `${fieldLabel} can't equal two different values at once — this will return no results`,
            conditionIds: eqConditions.map((c) => c.id),
          });
        }
        // AND with same value → duplicate
        for (const ids of valueSet.values()) {
          if (ids.length > 1) {
            warnings.push({
              type: 'redundancy',
              message: `Duplicate: ${fieldLabel} has the same condition twice`,
              conditionIds: ids,
            });
          }
        }
      }

      if (logicalOperator === 'OR') {
        // OR with same field + same value → duplicate
        for (const ids of valueSet.values()) {
          if (ids.length > 1) {
            warnings.push({
              type: 'redundancy',
              message: `Duplicate: ${fieldLabel} has the same condition twice`,
              conditionIds: ids,
            });
          }
        }

        // OR with $eq values covering ALL enum options → redundant (matches everything)
        if (
          fieldDef?.options &&
          fieldDef.options.length > 0 &&
          distinctValues.length >= fieldDef.options.length
        ) {
          warnings.push({
            type: 'redundancy',
            message: `${fieldLabel} matches every possible value — this filter has no effect`,
            conditionIds: eqConditions.map((c) => c.id),
          });
        }
      }
    }

    // Boolean fields: true AND false = contradiction, true OR false = redundant
    if (fieldDef?.fieldType === 'boolean') {
      const boolConditions = group.filter((c) => c.operator === '$eq');
      if (boolConditions.length >= 2) {
        const vals = new Set(boolConditions.map((c) => String(c.value)));
        if (vals.size > 1 && logicalOperator === 'AND') {
          warnings.push({
            type: 'contradiction',
            message: `${fieldLabel} can't be both Yes and No — this will return no results`,
            conditionIds: boolConditions.map((c) => c.id),
          });
        }
        if (vals.size > 1 && logicalOperator === 'OR') {
          warnings.push({
            type: 'redundancy',
            message: `${fieldLabel} is Yes or No covers everything — this filter has no effect`,
            conditionIds: boolConditions.map((c) => c.id),
          });
        }
      }
    }
  }

  // Deduplicate warnings by conditionIds set
  const seen = new Set<string>();
  return warnings.filter((w) => {
    const key = w.conditionIds.sort().join(',') + w.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
