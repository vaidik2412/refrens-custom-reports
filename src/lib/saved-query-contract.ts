import type { DateFieldConfig } from '@/types';
import { resolveDateField } from './date-utils';

export const DATE_FILTER_ACCESSORS = ['invoiceDate', 'dueDate'] as const;

type DateAccessor = (typeof DATE_FILTER_ACCESSORS)[number];

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatDateOnly(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return undefined;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeFixedDateRange(range: unknown): DateFieldConfig['fixedDateRange'] | undefined {
  if (!isPlainObject(range)) return undefined;

  const gte = formatDateOnly(range.$gte);
  const lte = formatDateOnly(range.$lte);

  if (!gte && !lte) return undefined;

  return {
    ...(gte ? { $gte: gte } : {}),
    ...(lte ? { $lte: lte } : {}),
  } as DateFieldConfig['fixedDateRange'];
}

function normalizeCustomPeriod(config: DateFieldConfig): DateFieldConfig {
  if (config.dynamicPreset !== 'custom_period') return config;

  const rawUnit = config.customUnit as 'days' | 'weeks' | 'months' | undefined;
  const multiplier =
    rawUnit === 'weeks' ? 7 : rawUnit === 'months' ? 30 : 1;
  const days =
    typeof config.customNumber === 'number' && Number.isFinite(config.customNumber)
      ? Math.max(1, Math.round(config.customNumber * multiplier))
      : 7;

  return {
    ...config,
    customNumber: days,
    customUnit: 'days',
    customDirection: config.customDirection || 'this',
  };
}

export function isDateAccessor(key: string): key is DateAccessor {
  return DATE_FILTER_ACCESSORS.includes(key as DateAccessor);
}

export function normalizeDateFieldConfig(input: any): DateFieldConfig | null {
  if (!input || typeof input.accessor !== 'string' || !input.accessor) return null;

  const fixedDateRange = normalizeFixedDateRange(input.fixedDateRange);
  const dynamicPreset =
    input.dynamicPreset === 'custom' ? 'custom_period' : input.dynamicPreset;

  const base: DateFieldConfig = {
    accessor: input.accessor,
    dateBehaviour:
      input.dateBehaviour === 'dynamic' || input.dateBehaviour === 'fixed'
        ? input.dateBehaviour
        : fixedDateRange
          ? 'fixed'
          : 'dynamic',
    ...(fixedDateRange ? { fixedDateRange } : {}),
    ...(dynamicPreset ? { dynamicPreset } : {}),
    ...(input.customDirection ? { customDirection: input.customDirection } : {}),
    ...(typeof input.customNumber === 'number' ? { customNumber: input.customNumber } : {}),
    ...(input.customUnit ? { customUnit: input.customUnit } : {}),
    ...(input.dateOperator ? { dateOperator: input.dateOperator } : {}),
    ...(input._id ? { _id: String(input._id) } : {}),
  };

  if (
    base.dateBehaviour === 'fixed' &&
    fixedDateRange &&
    !base.dateOperator
  ) {
    if (fixedDateRange.$gte && fixedDateRange.$lte) {
      base.dateOperator = '$between';
    } else if (fixedDateRange.$gte) {
      base.dateOperator = '$gte';
    } else if (fixedDateRange.$lte) {
      base.dateOperator = '$lte';
    }
  }

  return normalizeCustomPeriod(base);
}

export function normalizeDateFields(dateFields: any[] | undefined): DateFieldConfig[] {
  if (!Array.isArray(dateFields)) return [];

  const deduped = new Map<string, DateFieldConfig>();
  for (const rawField of dateFields) {
    const normalized = normalizeDateFieldConfig(rawField);
    if (normalized) deduped.set(normalized.accessor, normalized);
  }

  return Array.from(deduped.values());
}

function normalizeLegacyQuery(query: Record<string, any>): Record<string, any> {
  const normalized = { ...(query || {}) };

  if (normalized['recurringInvoice.frequency']?.$ne === 'NONE') {
    normalized['recurringInvoice.frequency'] = {
      ...normalized['recurringInvoice.frequency'],
      $ne: 'None',
    };
  }

  if (normalized.einvoiceGeneratedStatus === 'NOT GENERATED') {
    normalized.einvoiceGeneratedStatus = 'NOT_GENERATED';
  }

  if (normalized.creator && !normalized.addedBy) {
    normalized.addedBy = normalized.creator;
    delete normalized.creator;
  }

  return normalized;
}

function stripEmptyArrayOperators(query: Record<string, any>): Record<string, any> {
  return Object.entries(query || {}).reduce<Record<string, any>>((acc, [key, value]) => {
    if (!isPlainObject(value)) {
      acc[key] = value;
      return acc;
    }

    const cleaned = Object.entries(value).reduce<Record<string, any>>((nested, [op, opValue]) => {
      if (
        (op === '$in' || op === '$all' || op === '$nin' || op === '$inOptions') &&
        Array.isArray(opValue) &&
        opValue.length === 0
      ) {
        return nested;
      }

      nested[op] = opValue;
      return nested;
    }, {});

    if (Object.keys(cleaned).length > 0) {
      acc[key] = cleaned;
    }

    return acc;
  }, {});
}

export function materializeSavedQueryFilters(
  query: Record<string, any>,
  dateFields: any[] | undefined
): Record<string, any> {
  const materialized = stripEmptyArrayOperators(normalizeLegacyQuery(query || {}));

  for (const dateField of normalizeDateFields(dateFields)) {
    materialized[dateField.accessor] = resolveDateField(dateField);
  }

  return materialized;
}

export function upsertFixedDateField(
  dateFields: DateFieldConfig[],
  accessor: string,
  range: { $gte?: string; $lte?: string }
): DateFieldConfig[] {
  const next = normalizeDateFields(dateFields).filter((field) => field.accessor !== accessor);
  const fixedDateRange = normalizeFixedDateRange(range);

  if (!fixedDateRange) return next;

  next.push({
    accessor,
    dateBehaviour: 'fixed',
    fixedDateRange,
    dateOperator:
      fixedDateRange.$gte && fixedDateRange.$lte
        ? '$between'
        : fixedDateRange.$gte
          ? '$gte'
          : '$lte',
  });

  return next;
}

export function removeDateField(
  dateFields: DateFieldConfig[],
  accessor: string
): DateFieldConfig[] {
  return normalizeDateFields(dateFields).filter((field) => field.accessor !== accessor);
}

export function buildSavedQueryPayload(
  filters: Record<string, any>,
  dateFields: DateFieldConfig[]
): {
  query: Record<string, any>;
  dateFields: DateFieldConfig[];
} {
  const normalizedDateFields = normalizeDateFields(dateFields);
  const query = stripEmptyArrayOperators(normalizeLegacyQuery(filters || {}));

  for (const dateField of normalizedDateFields) {
    if (dateField.dateBehaviour === 'dynamic') {
      delete query[dateField.accessor];
    } else if (dateField.fixedDateRange) {
      query[dateField.accessor] = dateField.fixedDateRange;
    }
  }

  return {
    query,
    dateFields: normalizedDateFields,
  };
}

function sortValue(value: any): any {
  if (Array.isArray(value)) return value.map(sortValue);
  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        const next = sortValue(value[key]);
        if (next !== undefined) acc[key] = next;
        return acc;
      }, {});
  }
  return value;
}

export function stableSerialize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}
