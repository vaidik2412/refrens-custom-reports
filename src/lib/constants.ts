import type { FilterFieldConfig, SystemReport } from '@/types';

export const SYSTEM_REPORTS: SystemReport[] = [
  {
    id: 'active-invoice',
    displayName: 'Active Invoice',
    query: { billType: 'INVOICE', isRemoved: false },
    isSystem: true,
  },
  {
    id: 'recurring-invoice',
    displayName: 'Recurring Invoice',
    query: { billType: 'INVOICE', 'recurringInvoice.frequency': { $ne: 'None' }, isRemoved: false },
    isSystem: true,
  },
  {
    id: 'deleted-invoice',
    displayName: 'Deleted Invoice',
    query: { isRemoved: true },
    isSystem: true,
  },
];

export const BILL_TYPE_OPTIONS = [
  { label: 'Invoice', value: 'INVOICE' },
  { label: 'Proforma Invoice', value: 'PROFORMAINV' },
  { label: 'Credit Note', value: 'CREDITNOTE' },
  { label: 'Purchase Order', value: 'PURCHASEORDER' },
  { label: 'Expense Receipt', value: 'EXPENSERECEIPT' },
  { label: 'Delivery Challan', value: 'DELIVERYCHALAN' },
  { label: 'Quotation', value: 'QUOTATION' },
  { label: 'Sales Order', value: 'SALESORDER' },
];

export const STATUS_OPTIONS = [
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Draft', value: 'DRAFT' },
];

export const CURRENCY_OPTIONS = [
  { label: 'INR (₹)', value: 'INR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'AED (د.إ)', value: 'AED' },
  { label: 'SAR (﷼)', value: 'SAR' },
  { label: 'MYR (RM)', value: 'MYR' },
  { label: 'SGD (S$)', value: 'SGD' },
  { label: 'AUD (A$)', value: 'AUD' },
  { label: 'CAD (C$)', value: 'CAD' },
];

export const TAX_TYPE_OPTIONS = [
  { label: 'India (GST)', value: 'INDIA' },
  { label: 'UAE (VAT)', value: 'UAE' },
  { label: 'Malaysia (SST)', value: 'MALAYSIA' },
  { label: 'Saudi Arabia (VAT)', value: 'SAUDI_ARABIA' },
  { label: 'None', value: 'NONE' },
];

export const E_INVOICE_STATUS_OPTIONS = [
  { label: 'Not Generated', value: 'NOT_GENERATED' },
  { label: 'Generated', value: 'GENERATED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export const SOURCE_OPTIONS = [
  { label: 'Dashboard', value: 'DASHBOARD' },
  { label: 'Bulk Upload', value: 'BULK_UPLOAD' },
  { label: 'API', value: 'API' },
  { label: 'Shared', value: 'SHARED' },
  { label: 'Zoho Import', value: 'ZOHO' },
  { label: 'Payment', value: 'PAYMENT' },
];

export const RECURRING_FREQUENCY_OPTIONS = [
  { label: 'None', value: 'None' },
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Quarterly', value: 'Quarterly' },
  { label: 'Yearly', value: 'Yearly' },
];

export const GST_STATE_OPTIONS = [
  { label: 'Andhra Pradesh', value: '37' },
  { label: 'Delhi', value: '07' },
  { label: 'Gujarat', value: '24' },
  { label: 'Karnataka', value: '29' },
  { label: 'Kerala', value: '32' },
  { label: 'Maharashtra', value: '27' },
  { label: 'Rajasthan', value: '08' },
  { label: 'Tamil Nadu', value: '33' },
  { label: 'Telangana', value: '36' },
  { label: 'Uttar Pradesh', value: '09' },
  { label: 'West Bengal', value: '19' },
];

export const PRIMARY_FILTERS: FilterFieldConfig[] = [
  {
    key: 'billType',
    label: 'Bill Type',
    type: 'select',
    options: BILL_TYPE_OPTIONS,
    primary: true,
    placeholder: 'All Types',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS,
    primary: true,
    placeholder: 'All Statuses',
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    type: 'date-range',
    primary: true,
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    type: 'date-range',
    primary: true,
  },
  {
    key: 'client',
    label: 'Billed To',
    type: 'search-select',
    primary: true,
    placeholder: 'Search client...',
  },
  {
    key: 'currency',
    label: 'Currency',
    type: 'select',
    options: CURRENCY_OPTIONS,
    primary: true,
    placeholder: 'All Currencies',
  },
];

export const SECONDARY_FILTERS: FilterFieldConfig[] = [
  {
    key: 'isExpenditure',
    label: 'Expenditure',
    type: 'boolean',
    primary: false,
  },
  {
    key: 'taxType',
    label: 'Tax Type',
    type: 'select',
    options: TAX_TYPE_OPTIONS,
    primary: false,
    placeholder: 'All Tax Types',
  },
  {
    key: 'einvoiceGeneratedStatus',
    label: 'E-Invoice Status',
    type: 'select',
    options: E_INVOICE_STATUS_OPTIONS,
    primary: false,
    placeholder: 'All Statuses',
  },
  {
    key: 'igst',
    label: 'IGST',
    type: 'boolean',
    primary: false,
  },
  {
    key: 'source',
    label: 'Source',
    type: 'select',
    options: SOURCE_OPTIONS,
    primary: false,
    placeholder: 'All Sources',
  },
  {
    key: 'tags',
    label: 'Tags',
    type: 'multi-select',
    primary: false,
    placeholder: 'Search tags...',
  },
  {
    key: 'reverseCharge',
    label: 'Reverse Charge',
    type: 'boolean',
    primary: false,
  },
  {
    key: 'placeOfSupply',
    label: 'Place of Supply',
    type: 'select',
    options: GST_STATE_OPTIONS,
    primary: false,
    placeholder: 'All States',
  },
  {
    key: 'totals.total',
    label: 'Total Amount',
    type: 'number-range',
    primary: false,
  },
  {
    key: 'balance.due',
    label: 'Balance Due',
    type: 'number-range',
    primary: false,
  },
  {
    key: 'recurringInvoice.frequency',
    label: 'Recurring Frequency',
    type: 'select',
    options: RECURRING_FREQUENCY_OPTIONS,
    primary: false,
    placeholder: 'All Frequencies',
  },
];

export const ALL_FILTERS = [...PRIMARY_FILTERS, ...SECONDARY_FILTERS];

// ── NOB (Nature of Business) Constants ─────────────────────────────────

/** Display order for NOB groups in the Report Selector dropdown */
export const NOB_ORDER = [
  'KNOWLEDGE_SERVICES',
  'SOFTWARE_PRODUCT',
  'CONTRACTING_SERVICES',
  'TRADING_DISTRIBUTION',
  'DIGITAL_STORE',
  'MANUFACTURING',
  'RETAIL',
] as const;

/** Human-readable labels for each NOB category */
export const NOB_DISPLAY_NAMES: Record<string, string> = {
  KNOWLEDGE_SERVICES: 'Knowledge Services',
  SOFTWARE_PRODUCT: 'S/w Product',
  CONTRACTING_SERVICES: 'Contracting Services',
  TRADING_DISTRIBUTION: 'Trading / Distribution',
  DIGITAL_STORE: 'Digital Store',
  MANUFACTURING: 'Manufacturing',
  RETAIL: 'Retail',
};

/**
 * Maps filter keys to human-readable labels for Applied Filter pills.
 */
export function getFilterLabel(key: string): string {
  const config = ALL_FILTERS.find((f) => f.key === key);
  return config?.label || key;
}

/**
 * Formats a filter value for display in pills.
 */
export function formatFilterValue(key: string, value: any): string {
  const config = ALL_FILTERS.find((f) => f.key === key);
  if (!config) {
    // Smart fallback for unknown filter keys (e.g. from default reports)
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object' && value !== null) {
      if (value.$in && Array.isArray(value.$in)) return value.$in.join(', ');
      if (value.$nin && Array.isArray(value.$nin)) return `Not: ${value.$nin.join(', ')}`;
      if (value.$ne !== undefined) return `≠ ${value.$ne}`;
      const parts: string[] = [];
      if (value.$gt !== undefined) parts.push(`> ${value.$gt}`);
      if (value.$gte !== undefined) parts.push(`≥ ${value.$gte}`);
      if (value.$lte !== undefined) parts.push(`≤ ${value.$lte}`);
      if (parts.length > 0) return parts.join(', ');
      return JSON.stringify(value);
    }
    return String(value);
  }

  if (config.type === 'select' && config.options) {
    // Handle $nin operator: { $nin: ['INR'] } → "Not: INR (₹)"
    if (typeof value === 'object' && value.$nin && Array.isArray(value.$nin)) {
      const labels = value.$nin.map((v: string) => {
        const opt = config.options!.find((o) => o.value === v);
        return opt?.label || v;
      });
      return `Not: ${labels.join(', ')}`;
    }
    // Handle $in operator: { $in: ['UNPAID', 'OVERDUE'] } → "UNPAID, OVERDUE"
    if (typeof value === 'object' && value.$in && Array.isArray(value.$in)) {
      const labels = value.$in.map((v: string) => {
        const opt = config.options!.find((o) => o.value === v);
        return opt?.label || v;
      });
      return labels.join(', ');
    }
    const opt = config.options.find((o) => o.value === value);
    return opt?.label || String(value);
  }

  if (config.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (config.type === 'date-range' && typeof value === 'object') {
    const gte = value.$gte || '';
    const lte = value.$lte || '';
    return `${gte} – ${lte}`;
  }

  if (config.type === 'search-select' && typeof value === 'object' && value !== null) {
    if (Array.isArray(value.$inOptions) && value.$inOptions.length > 0) {
      return value.$inOptions.map((option: { label: string }) => option.label).join(', ');
    }
    if (Array.isArray(value.$in)) {
      return value.$in.join(', ');
    }
  }

  if (config.type === 'number-range' && typeof value === 'object') {
    const parts: string[] = [];
    if (value.$gt !== undefined) parts.push(`> ${value.$gt}`);
    if (value.$gte !== undefined) parts.push(`≥ ${value.$gte}`);
    if (value.$lt !== undefined) parts.push(`< ${value.$lt}`);
    if (value.$lte !== undefined) parts.push(`≤ ${value.$lte}`);
    return parts.join(', ');
  }

  if (config.type === 'search-select' && typeof value === 'object' && value.$inOptions) {
    return value.$inOptions.map((o: any) => o.label).join(', ');
  }

  if (config.type === 'multi-select' && typeof value === 'object' && value.$in) {
    return value.$in.join(', ');
  }

  return String(value);
}
