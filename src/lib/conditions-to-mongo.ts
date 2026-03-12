import type { QueryGroup } from '@/types/query-builder';
import { getFieldEntry } from './field-registry';
import { resolveDynamicPreset } from './date-utils';

/**
 * Converts a QueryGroup into a MongoDB-compatible query object.
 *
 * For now all conditions are AND'd (top-level keys in the object).
 * When the same field appears multiple times, operators are merged
 * into a single object, e.g. two conditions on totals.total with
 * $gte and $lte become { 'totals.total': { $gte: X, $lte: Y } }.
 *
 * Future: When OR groups are added, wrap in { $or: [...] } or { $and: [...] }.
 */
export function conditionsToMongoQuery(
  billType: string,
  group: QueryGroup
): Record<string, any> {
  const query: Record<string, any> = { billType };

  for (const condition of group.conditions) {
    if (!condition.field) continue;
    if (condition.value === undefined || condition.value === null || condition.value === '') {
      continue;
    }

    // For $in, skip empty arrays
    if (condition.operator === '$in' && Array.isArray(condition.value) && condition.value.length === 0) {
      continue;
    }

    // For $between, skip if neither from nor to is set
    if (condition.operator === '$between') {
      const { from, to } = (condition.value || {}) as { from?: string; to?: string };
      if (!from && !to) continue;
    }

    const fieldEntry = getFieldEntry(condition.field);
    const mongoKey = fieldEntry?.mongoField || condition.field;
    const op = condition.operator;

    if (op === '$between') {
      // Handle dynamic date presets
      if (condition.value?.dynamic === true) {
        let resolved: { $gte: string; $lte: string };
        if (condition.value.preset === 'custom_period') {
          const toDays = (unit: string) =>
            unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;
          const days = (condition.value.number || 7) * toDays(condition.value.unit || 'days');
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const fmt = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dy = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dy}`;
          };
          if (condition.value.direction === 'next') {
            const end = new Date(today);
            end.setDate(end.getDate() + days - 1);
            resolved = { $gte: fmt(today), $lte: fmt(end) };
          } else {
            const start = new Date(today);
            start.setDate(start.getDate() - (days - 1));
            resolved = { $gte: fmt(start), $lte: fmt(today) };
          }
        } else {
          resolved = resolveDynamicPreset(condition.value.preset || 'this_month');
        }
        query[mongoKey] = resolved;
      } else {
        // Fixed: Expand into { $gte: from, $lte: to } — only include bounds that are set
        const { from, to } = (condition.value || {}) as { from?: string; to?: string };
        if (typeof query[mongoKey] !== 'object' || query[mongoKey] === null) {
          query[mongoKey] = {};
        }
        if (from) query[mongoKey].$gte = from;
        if (to) query[mongoKey].$lte = to;
      }
    } else if (op === '$eq') {
      // Direct equality — if there's already a compound operator object, add $eq inside
      if (typeof query[mongoKey] === 'object' && query[mongoKey] !== null) {
        query[mongoKey].$eq = condition.value;
      } else {
        query[mongoKey] = condition.value;
      }
    } else if (op === '$regex') {
      query[mongoKey] = { $regex: condition.value, $options: 'i' };
    } else if ((op === '$gte' || op === '$lte') && condition.value?.dynamic === true) {
      // Dynamic date for single-bound operators
      let resolved: { $gte: string; $lte: string };
      if (condition.value.preset === 'custom_period') {
        const toDays = (unit: string) =>
          unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;
        const days = (condition.value.number || 7) * toDays(condition.value.unit || 'days');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const fmt = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dy = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dy}`;
        };
        if (condition.value.direction === 'next') {
          const end = new Date(today);
          end.setDate(end.getDate() + days - 1);
          resolved = { $gte: fmt(today), $lte: fmt(end) };
        } else {
          const start = new Date(today);
          start.setDate(start.getDate() - (days - 1));
          resolved = { $gte: fmt(start), $lte: fmt(today) };
        }
      } else {
        resolved = resolveDynamicPreset(condition.value.preset || 'today');
      }
      // $gte → use start of range, $lte → use end of range
      if (typeof query[mongoKey] !== 'object' || query[mongoKey] === null) {
        query[mongoKey] = {};
      }
      query[mongoKey][op] = op === '$gte' ? resolved.$gte : resolved.$lte;
    } else {
      // $gt, $gte, $lt, $lte, $in — merge into compound operator object
      if (typeof query[mongoKey] !== 'object' || query[mongoKey] === null) {
        query[mongoKey] = {};
      }
      query[mongoKey][op] = condition.value;
    }
  }

  return query;
}
