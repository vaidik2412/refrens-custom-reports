const { ObjectId } = require('mongodb');

const PROTOTYPE_BUSINESS_ID = new ObjectId('66dfea2f0be47436d6ff2ca5');
const PROTOTYPE_USER_ID = new ObjectId('64c8da6b59797bccd235f770');
const DATE_FILTER_ACCESSORS = ['invoiceDate', 'dueDate'];
const SAVED_QUERY_CONTRACT_VERSION = '2026-03-production-parity-v1';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeObjectId(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}

function formatDateOnly(value) {
  if (!value) return undefined;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return undefined;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeFixedDateRange(range) {
  if (!isPlainObject(range)) return undefined;

  const gte = formatDateOnly(range.$gte);
  const lte = formatDateOnly(range.$lte);

  if (!gte && !lte) return undefined;

  return {
    ...(gte ? { $gte: gte } : {}),
    ...(lte ? { $lte: lte } : {}),
  };
}

function normalizeDateFieldConfig(input) {
  if (!input || typeof input.accessor !== 'string' || !input.accessor) return null;

  const fixedDateRange = normalizeFixedDateRange(input.fixedDateRange);
  const dynamicPreset =
    input.dynamicPreset === 'custom' ? 'custom_period' : input.dynamicPreset;

  const normalized = {
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

  if (normalized.dynamicPreset === 'custom_period') {
    const multiplier =
      normalized.customUnit === 'weeks'
        ? 7
        : normalized.customUnit === 'months'
          ? 30
          : 1;
    normalized.customNumber =
      typeof normalized.customNumber === 'number'
        ? Math.max(1, Math.round(normalized.customNumber * multiplier))
        : 7;
    normalized.customUnit = 'days';
    normalized.customDirection = normalized.customDirection || 'this';
  }

  if (
    normalized.dateBehaviour === 'fixed' &&
    normalized.fixedDateRange &&
    !normalized.dateOperator
  ) {
    if (normalized.fixedDateRange.$gte && normalized.fixedDateRange.$lte) {
      normalized.dateOperator = '$between';
    } else if (normalized.fixedDateRange.$gte) {
      normalized.dateOperator = '$gte';
    } else if (normalized.fixedDateRange.$lte) {
      normalized.dateOperator = '$lte';
    }
  }

  return normalized;
}

function normalizeDateFields(dateFields) {
  if (!Array.isArray(dateFields)) return [];

  const deduped = new Map();
  for (const rawField of dateFields) {
    const normalized = normalizeDateFieldConfig(rawField);
    if (normalized) deduped.set(normalized.accessor, normalized);
  }

  return Array.from(deduped.values());
}

function resolveDynamicPreset(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const format = (date) => formatDateOnly(date);

  switch (preset) {
    case 'today':
      return { $gte: format(today), $lte: format(today) };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { $gte: format(yesterday), $lte: format(yesterday) };
    }
    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { $gte: format(start), $lte: format(today) };
    }
    case 'last_15_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 14);
      return { $gte: format(start), $lte: format(today) };
    }
    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { $gte: format(start), $lte: format(today) };
    }
    case 'last_45_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 44);
      return { $gte: format(start), $lte: format(today) };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { $gte: format(start), $lte: format(end) };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { $gte: format(start), $lte: format(end) };
    }
    case 'this_quarter': {
      const month = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), month, 1);
      const end = new Date(now.getFullYear(), month + 3, 0);
      return { $gte: format(start), $lte: format(end) };
    }
    case 'last_quarter': {
      const month = Math.floor(now.getMonth() / 3) * 3 - 3;
      const year = month < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const normalizedMonth = month < 0 ? month + 12 : month;
      const start = new Date(year, normalizedMonth, 1);
      const end = new Date(year, normalizedMonth + 3, 0);
      return { $gte: format(start), $lte: format(end) };
    }
    case 'this_year':
      return {
        $gte: format(new Date(now.getFullYear(), 0, 1)),
        $lte: format(new Date(now.getFullYear(), 11, 31)),
      };
    case 'last_year':
      return {
        $gte: format(new Date(now.getFullYear() - 1, 0, 1)),
        $lte: format(new Date(now.getFullYear() - 1, 11, 31)),
      };
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { $gte: format(tomorrow), $lte: format(tomorrow) };
    }
    case 'next_7_days': {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      return { $gte: format(today), $lte: format(end) };
    }
    case 'next_15_days': {
      const end = new Date(today);
      end.setDate(end.getDate() + 14);
      return { $gte: format(today), $lte: format(end) };
    }
    case 'next_30_days': {
      const end = new Date(today);
      end.setDate(end.getDate() + 29);
      return { $gte: format(today), $lte: format(end) };
    }
    case 'next_month': {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return { $gte: format(start), $lte: format(end) };
    }
    case 'next_quarter': {
      const month = Math.floor(now.getMonth() / 3) * 3 + 3;
      const year = month >= 12 ? now.getFullYear() + 1 : now.getFullYear();
      const normalizedMonth = month >= 12 ? month - 12 : month;
      const start = new Date(year, normalizedMonth, 1);
      const end = new Date(year, normalizedMonth + 3, 0);
      return { $gte: format(start), $lte: format(end) };
    }
    case 'next_year':
      return {
        $gte: format(new Date(now.getFullYear() + 1, 0, 1)),
        $lte: format(new Date(now.getFullYear() + 1, 11, 31)),
      };
    case 'custom_period':
    default:
      return { $gte: format(today), $lte: format(today) };
  }
}

function resolveDateField(config) {
  if (config.dateBehaviour === 'fixed' && config.fixedDateRange) {
    return config.fixedDateRange;
  }

  if (config.dynamicPreset === 'custom_period') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = config.customNumber || 7;
    if (config.customDirection === 'next') {
      const end = new Date(today);
      end.setDate(end.getDate() + days - 1);
      return { $gte: formatDateOnly(today), $lte: formatDateOnly(end) };
    }

    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return { $gte: formatDateOnly(start), $lte: formatDateOnly(today) };
  }

  return resolveDynamicPreset(config.dynamicPreset || 'today');
}

function mapLegacyClientFilter(filterValue, clientValueMap) {
  if (!filterValue) return filterValue;
  if (!clientValueMap) return filterValue;

  if (isPlainObject(filterValue) && Array.isArray(filterValue.$in)) {
    const resolvedIds = [];
    const inOptions = [];

    for (const rawValue of filterValue.$in) {
      if (looksLikeObjectId(rawValue)) {
        resolvedIds.push(rawValue);
        const label =
          filterValue.$inOptions?.find((option) => option.value === rawValue)?.label ||
          clientValueMap.idsToLabels?.get(rawValue) ||
          rawValue;
        inOptions.push({ label, value: rawValue });
        continue;
      }

      const matches = clientValueMap.labelsToIds?.get(String(rawValue)) || [];
      for (const match of matches) {
        if (resolvedIds.includes(match)) continue;
        resolvedIds.push(match);
        inOptions.push({ label: String(rawValue), value: match });
      }
    }

    if (resolvedIds.length > 0) {
      return {
        ...filterValue,
        $in: resolvedIds,
        $inOptions: inOptions,
      };
    }
  }

  return filterValue;
}

function normalizeLegacyQueryShape(query, options = {}) {
  const normalized = { ...(query || {}) };
  const { clientValueMap } = options;

  if (normalized['billedTo.name'] && !normalized.client) {
    normalized.client = mapLegacyClientFilter(normalized['billedTo.name'], clientValueMap);
    delete normalized['billedTo.name'];
  }

  if (normalized.client) {
    normalized.client = mapLegacyClientFilter(normalized.client, clientValueMap);
  }

  if (normalized.creator && !normalized.addedBy) {
    normalized.addedBy = normalized.creator;
    delete normalized.creator;
  }

  if (normalized['recurringInvoice.frequency']?.$ne === 'NONE') {
    normalized['recurringInvoice.frequency'] = {
      ...normalized['recurringInvoice.frequency'],
      $ne: 'None',
    };
  }

  if (normalized.einvoiceGeneratedStatus === 'NOT GENERATED') {
    normalized.einvoiceGeneratedStatus = 'NOT_GENERATED';
  }

  return normalized;
}

function materializeSavedQueryFilters(query, dateFields, options = {}) {
  const materialized = normalizeLegacyQueryShape(query, options);

  for (const dateField of normalizeDateFields(dateFields)) {
    materialized[dateField.accessor] = resolveDateField(dateField);
  }

  return materialized;
}

function toMongoComparable(value, field) {
  if (Array.isArray(value)) {
    return value.map((entry) => toMongoComparable(entry, field));
  }

  if (isPlainObject(value)) {
    const next = {};
    for (const [key, rawEntry] of Object.entries(value)) {
      if (key === '$inOptions') continue;
      if ((key === '$gte' || key === '$gt') && typeof rawEntry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawEntry)) {
        next[key] = new Date(`${rawEntry}T00:00:00.000Z`);
      } else if ((key === '$lte' || key === '$lt') && typeof rawEntry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawEntry)) {
        next[key] = new Date(`${rawEntry}T23:59:59.999Z`);
      } else {
        next[key] = toMongoComparable(rawEntry, field);
      }
    }
    return next;
  }

  if (
    looksLikeObjectId(value) &&
    (field === 'client' ||
      field === 'business' ||
      field === 'addedBy' ||
      field === 'creator' ||
      field === 'owner' ||
      field === 'author')
  ) {
    return new ObjectId(value);
  }

  return value;
}

function buildMongoQuery(query, dateFields, options = {}) {
  const materialized = materializeSavedQueryFilters(query, dateFields, options);
  const mongoQuery = {};

  for (const [field, value] of Object.entries(materialized)) {
    mongoQuery[field] = toMongoComparable(value, field);
  }

  return mongoQuery;
}

function createSavedQueryDoc({
  _id,
  displayName,
  description = '',
  query = {},
  dateFields = [],
  isDefault = false,
  nob,
  systemSource = 'seed-saved-queries',
  metadata = {},
}) {
  const now = new Date();
  const normalizedDateFields = normalizeDateFields(dateFields).map((field) => ({
    ...field,
    _id: field._id ? new ObjectId(field._id) : new ObjectId(),
  }));

  return {
    _id: _id || new ObjectId(),
    isGlobal: false,
    business: PROTOTYPE_BUSINESS_ID,
    addedBy: PROTOTYPE_USER_ID,
    displayInChatbot: false,
    queryType: 'FEATHERS_SERVICE',
    querySubType: 'FIND',
    source: 'DASHBOARD',
    serviceName: 'invoices',
    query,
    dateFields: normalizedDateFields,
    displayName,
    description,
    isArchived: false,
    ...(isDefault ? { isDefault: true } : {}),
    ...(nob ? { nob } : {}),
    _systemMeta: {
      source: systemSource,
      contractVersion: SAVED_QUERY_CONTRACT_VERSION,
      ...metadata,
    },
    createdAt: now,
    updatedAt: now,
    __v: 0,
  };
}

function normalizeSavedQueryDoc(doc, options = {}) {
  const normalizedDateFields = normalizeDateFields(doc.dateFields).map((field) => ({
    ...field,
    _id: field._id ? new ObjectId(String(field._id)) : new ObjectId(),
  }));

  const normalizedQuery = normalizeLegacyQueryShape(doc.query, options);

  return {
    ...doc,
    query: normalizedQuery,
    dateFields: normalizedDateFields,
    updatedAt: new Date(),
    _migrationMeta: {
      version: SAVED_QUERY_CONTRACT_VERSION,
      migratedAt: new Date(),
    },
    _systemMeta: {
      ...(doc._systemMeta || {}),
      contractVersion: SAVED_QUERY_CONTRACT_VERSION,
    },
  };
}

module.exports = {
  DATE_FILTER_ACCESSORS,
  PROTOTYPE_BUSINESS_ID,
  PROTOTYPE_USER_ID,
  SAVED_QUERY_CONTRACT_VERSION,
  buildMongoQuery,
  createSavedQueryDoc,
  looksLikeObjectId,
  materializeSavedQueryFilters,
  normalizeDateFieldConfig,
  normalizeDateFields,
  normalizeSavedQueryDoc,
  resolveDateField,
};
