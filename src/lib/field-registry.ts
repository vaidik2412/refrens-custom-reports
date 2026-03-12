import type { FieldRegistryEntry, Operator } from '@/types/query-builder';
import {
  STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  TAX_TYPE_OPTIONS,
  E_INVOICE_STATUS_OPTIONS,
  SOURCE_OPTIONS,
  RECURRING_FREQUENCY_OPTIONS,
  GST_STATE_OPTIONS,
} from './constants';

// ── Operator sets by field type (all index-friendly) ────────────────

const ENUM_OPERATORS: Operator[] = ['$eq', '$in'];
const STRING_OPERATORS: Operator[] = ['$eq', '$regex'];
const NUMBER_OPERATORS: Operator[] = ['$eq', '$gt', '$gte', '$lt', '$lte'];
const DATE_OPERATORS: Operator[] = ['$between', '$gte', '$lte'];
const BOOLEAN_OPERATORS: Operator[] = ['$eq'];
const SEARCH_OPERATORS: Operator[] = ['$in'];

// ── Field Registry ──────────────────────────────────────────────────

export const FIELD_REGISTRY: FieldRegistryEntry[] = [
  // ─── Core ─────────────────────────────────────────────────────────
  {
    key: 'status',
    label: 'Status',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: STATUS_OPTIONS,
    category: 'core',
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    fieldType: 'date',
    operators: DATE_OPERATORS,
    defaultOperator: '$between',
    category: 'core',
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    fieldType: 'date',
    operators: DATE_OPERATORS,
    defaultOperator: '$between',
    category: 'core',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER'],
  },
  {
    key: 'client',
    label: 'Billed To (Client)',
    fieldType: 'search',
    operators: SEARCH_OPERATORS,
    defaultOperator: '$in',
    searchEndpoint: '/api/clients/search',
    category: 'core',
    mongoField: 'billedTo.name',
  },
  {
    key: 'currency',
    label: 'Currency',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: CURRENCY_OPTIONS,
    category: 'core',
  },
  {
    key: 'invoiceNumber',
    label: 'Invoice Number',
    fieldType: 'string',
    operators: STRING_OPERATORS,
    defaultOperator: '$regex',
    category: 'core',
  },

  // ─── Financial ────────────────────────────────────────────────────
  {
    key: 'totals.total',
    label: 'Total Amount',
    fieldType: 'number',
    operators: NUMBER_OPERATORS,
    defaultOperator: '$gte',
    category: 'financial',
  },
  {
    key: 'totals.subTotal',
    label: 'Subtotal',
    fieldType: 'number',
    operators: NUMBER_OPERATORS,
    defaultOperator: '$gte',
    category: 'financial',
  },
  {
    key: 'balance.due',
    label: 'Balance Due',
    fieldType: 'number',
    operators: NUMBER_OPERATORS,
    defaultOperator: '$gte',
    category: 'financial',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER'],
  },

  // ─── Tax & Compliance ─────────────────────────────────────────────
  {
    key: 'taxType',
    label: 'Tax Type',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: TAX_TYPE_OPTIONS,
    category: 'tax',
  },
  {
    key: 'igst',
    label: 'IGST',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'tax',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER', 'EXPENSERECEIPT', 'DELIVERYCHALAN'],
  },
  {
    key: 'reverseCharge',
    label: 'Reverse Charge',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'tax',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER', 'EXPENSERECEIPT', 'DELIVERYCHALAN'],
  },
  {
    key: 'placeOfSupply',
    label: 'Place of Supply',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: GST_STATE_OPTIONS,
    category: 'tax',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER', 'EXPENSERECEIPT', 'DELIVERYCHALAN'],
  },
  {
    key: 'einvoiceGeneratedStatus',
    label: 'E-Invoice Status',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: E_INVOICE_STATUS_OPTIONS,
    category: 'tax',
    billTypes: ['INVOICE', 'CREDITNOTE'],
  },

  // ─── Metadata ─────────────────────────────────────────────────────
  {
    key: 'isExpenditure',
    label: 'Expenditure',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'metadata',
  },
  {
    key: 'source',
    label: 'Source',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: SOURCE_OPTIONS,
    category: 'metadata',
  },
  {
    key: 'tags',
    label: 'Tags',
    fieldType: 'multi-enum',
    operators: ['$in'] as Operator[],
    defaultOperator: '$in',
    category: 'metadata',
  },
  {
    key: 'recurringInvoice.frequency',
    label: 'Recurring Frequency',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: RECURRING_FREQUENCY_OPTIONS,
    category: 'metadata',
    billTypes: ['INVOICE', 'PROFORMAINV'],
  },
  {
    key: 'creator',
    label: 'Created By',
    fieldType: 'search',
    operators: SEARCH_OPERATORS,
    defaultOperator: '$in',
    searchEndpoint: '/api/clients/search',
    category: 'metadata',
    mongoField: 'addedBy',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

export function getFieldEntry(key: string): FieldRegistryEntry | undefined {
  return FIELD_REGISTRY.find((f) => f.key === key);
}

export function getFieldsByCategory(): Record<string, FieldRegistryEntry[]> {
  const grouped: Record<string, FieldRegistryEntry[]> = {};
  for (const entry of FIELD_REGISTRY) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }
  return grouped;
}

export const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Fields',
  financial: 'Financial',
  tax: 'Tax & Compliance',
  metadata: 'Metadata',
};

export const OPERATOR_LABELS: Record<string, string> = {
  $eq: 'is',
  $gt: 'greater than',
  $gte: 'at least',
  $lt: 'less than',
  $lte: 'at most',
  $in: 'is any of',
  $regex: 'contains',
  $between: 'is between',
};

/** Returns fields applicable to the given bill type. Null = all fields. */
export function getFieldsForBillType(billType: string | null): FieldRegistryEntry[] {
  if (!billType) return FIELD_REGISTRY;
  return FIELD_REGISTRY.filter((f) => !f.billTypes || f.billTypes.includes(billType));
}

/** Like getFieldsByCategory, but filtered for a specific bill type. */
export function getFieldsByCategoryForBillType(
  billType: string | null
): Record<string, FieldRegistryEntry[]> {
  const fields = getFieldsForBillType(billType);
  const grouped: Record<string, FieldRegistryEntry[]> = {};
  for (const entry of fields) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }
  return grouped;
}

/** Date-specific operator labels (override the defaults for clarity) */
export const DATE_OPERATOR_LABELS: Record<string, string> = {
  $between: 'is between',
  $gte: 'on or after',
  $lte: 'on or before',
};
