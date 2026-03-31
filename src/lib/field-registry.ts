import type { FieldRegistryEntry, Operator } from '@/types/query-builder';
import {
  STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  TAX_TYPE_OPTIONS,
  E_INVOICE_STATUS_OPTIONS,
  INVOICE_ACCEPTANCE_OPTIONS,
  SOURCE_OPTIONS,
  RECURRING_FREQUENCY_OPTIONS,
  GST_STATE_OPTIONS,
  COUNTRY_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from './constants';

// ── Operator sets by field type (all index-friendly) ────────────────

const ENUM_OPERATORS: Operator[] = ['$eq', '$in'];
const ENUM_EXCLUDE_OPERATORS: Operator[] = ['$eq', '$in', '$nin'];
const ENUM_MULTI_OPERATORS: Operator[] = ['$in'];
const STRING_OPERATORS: Operator[] = ['$eq', '$regex'];
const NUMBER_OPERATORS: Operator[] = ['$eq', '$gt', '$gte', '$lt', '$lte'];
const DATE_OPERATORS: Operator[] = ['$between', '$gte', '$lte'];
const BOOLEAN_OPERATORS: Operator[] = ['$eq'];
const SEARCH_OPERATORS: Operator[] = ['$in'];
const ARRAY_MATCH_OPERATORS: Operator[] = ['$in', '$all'];

// ── Field Registry ──────────────────────────────────────────────────

export const FIELD_REGISTRY: FieldRegistryEntry[] = [
  // ─── Core ─────────────────────────────────────────────────────────
  {
    key: 'status',
    label: 'Status',
    fieldType: 'enum',
    operators: ENUM_EXCLUDE_OPERATORS,
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
  },
  {
    key: 'currency',
    label: 'Currency',
    fieldType: 'enum',
    operators: ENUM_EXCLUDE_OPERATORS,
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
  {
    key: 'balance.paid',
    label: 'Paid Amount',
    fieldType: 'number',
    operators: NUMBER_OPERATORS,
    defaultOperator: '$gte',
    category: 'financial',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER'],
  },
  {
    key: 'lastPaymentDate',
    label: 'Last Payment Date',
    fieldType: 'date',
    operators: DATE_OPERATORS,
    defaultOperator: '$between',
    category: 'financial',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER'],
  },
  {
    key: 'hasPayments',
    label: 'Has Payments',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'financial',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER'],
  },
  {
    key: 'adjustedCredit',
    label: 'Adjusted via Credit Note',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'financial',
    billTypes: ['INVOICE'],
  },

  // ─── Tax & Compliance ─────────────────────────────────────────────
  {
    key: 'taxType',
    label: 'Tax Type',
    fieldType: 'enum',
    operators: ENUM_EXCLUDE_OPERATORS,
    defaultOperator: '$eq',
    options: TAX_TYPE_OPTIONS,
    category: 'tax',
  },
  {
    key: 'igst',
    label: 'GST Type',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: [
      { label: 'IGST (Inter-state)', value: 'true' },
      { label: 'CGST + SGST (Intra-state)', value: 'false' },
    ],
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
    operators: ENUM_MULTI_OPERATORS,
    defaultOperator: '$in',
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
    key: 'invoiceAccepted',
    label: 'Acceptance Status',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: INVOICE_ACCEPTANCE_OPTIONS,
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
    operators: ARRAY_MATCH_OPERATORS,
    defaultOperator: '$all',
    category: 'metadata',
    searchEndpoint: '/api/tags/search',
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
    key: 'hasLinkedInvoice',
    label: 'Linked Invoice',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'metadata',
  },
  {
    key: 'bookKeepingSyncStatus.isSynced',
    label: 'Accounting Synced',
    fieldType: 'boolean',
    operators: BOOLEAN_OPERATORS,
    defaultOperator: '$eq',
    category: 'metadata',
  },
  // NOTE: 'Created By' (addedBy) removed — the field stores ObjectId references
  // to users, but we have no /api/users/search endpoint yet. Re-add when user
  // search is implemented.

  // ─── New filters (batch 2) ──────────────────────────────────────────
  {
    key: 'billedTo.country',
    label: 'Client Country',
    fieldType: 'enum',
    operators: ENUM_EXCLUDE_OPERATORS,
    defaultOperator: '$in',
    options: COUNTRY_OPTIONS,
    category: 'core',
  },
  {
    key: 'createdAt',
    label: 'Created At',
    fieldType: 'date',
    operators: DATE_OPERATORS,
    defaultOperator: '$between',
    category: 'metadata',
  },
  {
    key: 'items.hsn',
    label: 'HSN/SAC Code',
    fieldType: 'string',
    operators: ['$eq', '$regex', '$in'] as Operator[],
    defaultOperator: '$regex',
    category: 'tax',
  },
  {
    key: 'payments.paymentMethod',
    label: 'Payment Method',
    fieldType: 'enum',
    operators: ENUM_MULTI_OPERATORS,
    defaultOperator: '$in',
    options: PAYMENT_METHOD_OPTIONS,
    category: 'financial',
    billTypes: ['INVOICE', 'PROFORMAINV', 'CREDITNOTE', 'PURCHASEORDER'],
  },
  {
    key: 'totals.igst',
    label: 'Total Tax',
    fieldType: 'number',
    operators: NUMBER_OPERATORS,
    defaultOperator: '$gte',
    category: 'financial',
  },
  {
    key: 'billedTo.clientType',
    label: 'Client Type',
    fieldType: 'enum',
    operators: ENUM_OPERATORS,
    defaultOperator: '$eq',
    options: CLIENT_TYPE_OPTIONS,
    category: 'core',
  },
  {
    key: 'billedTo._state',
    label: 'Client State (GST)',
    fieldType: 'enum',
    operators: ENUM_EXCLUDE_OPERATORS,
    defaultOperator: '$in',
    options: GST_STATE_OPTIONS,
    category: 'core',
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
  $nin: 'is not any of',
  $all: 'has all of',
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

/**
 * Resolves the actual MongoDB field for the virtual `billedTo._state` key
 * based on the country context.
 * - IN (or unset) → billedTo.gstState (Indian GST state codes)
 * - US, AE, MY    → billedTo.stateCode (country-specific state codes)
 * - Others        → billedTo.state (free text)
 */
export function resolveStateMongoField(country?: string): string {
  if (!country || country === 'IN') return 'billedTo.gstState';
  if (['US', 'AE', 'MY'].includes(country)) return 'billedTo.stateCode';
  return 'billedTo.state';
}

/** Date-specific operator labels (override the defaults for clarity) */
export const DATE_OPERATOR_LABELS: Record<string, string> = {
  $between: 'is between',
  $gte: 'on or after',
  $lte: 'on or before',
};
