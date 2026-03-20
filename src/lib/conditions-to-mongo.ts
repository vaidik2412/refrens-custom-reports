import type { QueryCondition, QueryGroup } from '@/types/query-builder';
import { getFieldEntry } from './field-registry';
import { resolveDynamicPreset } from './date-utils';

// ── Single-condition helpers ─────────────────────────────────────────

/**
 * Resolves a dynamic or custom-period date value into a { $gte, $lte } range.
 */
function resolveDynamicDate(value: any): { $gte: string; $lte: string } {
  if (value.preset === 'custom_period') {
    const toDays = (unit: string) =>
      unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;
    const days = (value.number || 7) * toDays(value.unit || 'days');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dy}`;
    };
    if (value.direction === 'next') {
      const end = new Date(today);
      end.setDate(end.getDate() + days - 1);
      return { $gte: fmt(today), $lte: fmt(end) };
    }
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return { $gte: fmt(start), $lte: fmt(today) };
  }
  return resolveDynamicPreset(value.preset || 'this_month');
}

/**
 * Converts a single QueryCondition into a MongoDB filter fragment.
 * Returns null if the condition should be skipped (empty value, etc).
 */
function conditionToMongoFragment(condition: QueryCondition): Record<string, any> | null {
  if (!condition.field) return null;
  if (condition.value === undefined || condition.value === null || condition.value === '') {
    return null;
  }

  // Skip empty array operators
  if (
    (condition.operator === '$in' || condition.operator === '$nin' || condition.operator === '$all') &&
    Array.isArray(condition.value) &&
    condition.value.length === 0
  ) {
    return null;
  }

  // For $between: dynamic dates are always valid; fixed dates need at least one bound
  if (condition.operator === '$between' && condition.value?.dynamic !== true) {
    const { from, to } = (condition.value || {}) as { from?: string; to?: string };
    if (!from && !to) return null;
  }

  const fieldEntry = getFieldEntry(condition.field);
  const mongoKey = fieldEntry?.mongoField || condition.field;
  const op = condition.operator;

  if (op === '$between') {
    if (condition.value?.dynamic === true) {
      return { [mongoKey]: resolveDynamicDate(condition.value) };
    }
    const { from, to } = (condition.value || {}) as { from?: string; to?: string };
    const range: Record<string, string> = {};
    if (from) range.$gte = from;
    if (to) range.$lte = to;
    return { [mongoKey]: range };
  }

  if (op === '$eq') {
    return { [mongoKey]: condition.value };
  }

  if (op === '$regex') {
    return { [mongoKey]: { $regex: condition.value, $options: 'i' } };
  }

  if ((op === '$gte' || op === '$lte') && condition.value?.dynamic === true) {
    const resolved = resolveDynamicDate(condition.value);
    return { [mongoKey]: { [op]: op === '$gte' ? resolved.$gte : resolved.$lte } };
  }

  // $gt, $gte, $lt, $lte, $in, $all
  return { [mongoKey]: { [op]: condition.value } };
}

// ── Group-level conversion ───────────────────────────────────────────

/**
 * Merges multiple single-key fragments that share the same key into
 * compound operator objects where possible. E.g. two conditions on
 * totals.total with $gte and $lte become { 'totals.total': { $gte: X, $lte: Y } }.
 *
 * Returns the array of fragments (possibly merged).
 */
function mergeFragments(fragments: Record<string, any>[]): Record<string, any>[] {
  const merged: Record<string, any>[] = [];
  const byKey = new Map<string, Record<string, any>>();

  for (const frag of fragments) {
    const keys = Object.keys(frag);
    if (keys.length !== 1) {
      merged.push(frag);
      continue;
    }
    const key = keys[0];
    const val = frag[key];

    // Only merge operator objects (not plain values like { status: 'PAID' })
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const valKeys = Object.keys(val);
      const allOps = valKeys.every((k) => k.startsWith('$'));
      if (allOps && byKey.has(key)) {
        // Merge operators into existing
        Object.assign(byKey.get(key)![key], val);
        continue;
      }
      if (allOps) {
        const entry = { [key]: { ...val } };
        byKey.set(key, entry);
        merged.push(entry);
        continue;
      }
    }

    merged.push(frag);
  }

  return merged;
}

/**
 * Converts a QueryGroup into a MongoDB filter fragment (without billType).
 * Returns null if the group has no valid conditions or sub-groups.
 */
function groupToMongoFragment(group: QueryGroup): Record<string, any> | null {
  // Collect fragments from direct conditions
  const conditionFragments: Record<string, any>[] = [];
  for (const cond of group.conditions) {
    const frag = conditionToMongoFragment(cond);
    if (frag) conditionFragments.push(frag);
  }

  // Collect fragments from sub-groups
  const subGroupFragments: Record<string, any>[] = [];
  for (const subGroup of group.groups || []) {
    const frag = groupToMongoFragment(subGroup);
    if (frag) subGroupFragments.push(frag);
  }

  const allFragments = [...conditionFragments, ...subGroupFragments];
  if (allFragments.length === 0) return null;

  // Single item — no wrapping needed
  if (allFragments.length === 1) {
    return allFragments[0];
  }

  // AND: try to merge into a flat object if no key collisions
  if (group.logicalOperator === 'AND') {
    const merged = mergeFragments(allFragments);

    // Check if all fragments can be flattened into one object (no key collisions)
    const allKeys = merged.flatMap((f) => Object.keys(f));
    const uniqueKeys = new Set(allKeys);
    if (uniqueKeys.size === allKeys.length) {
      // Safe to flatten
      return Object.assign({}, ...merged);
    }

    // Key collision — must use $and
    return { $and: merged };
  }

  // OR
  return { $or: allFragments };
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Converts a QueryGroup into a MongoDB-compatible query object.
 *
 * - Simple AND groups with no sub-groups produce flat objects (backward compat).
 * - OR groups or groups with sub-groups produce { $and: [...] } / { $or: [...] }.
 * - billType is always injected at the top level.
 */
export function conditionsToMongoQuery(
  billType: string,
  group: QueryGroup
): Record<string, any> {
  const fragment = groupToMongoFragment(group);

  if (!fragment) return { billType };

  // If the fragment is a flat object (no $and/$or at top), merge with billType
  if (!fragment.$and && !fragment.$or) {
    return { billType, ...fragment };
  }

  // Otherwise, put billType alongside the logical operator
  return { billType, ...fragment };
}
