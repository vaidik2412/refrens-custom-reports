export type DynamicPreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_15_days'
  | 'last_30_days'
  | 'last_45_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'tomorrow'
  | 'next_7_days'
  | 'next_15_days'
  | 'next_30_days'
  | 'next_month'
  | 'next_quarter'
  | 'next_year'
  | 'custom_period';

export interface DateFieldConfig {
  accessor: string;
  dateBehaviour: 'fixed' | 'dynamic';
  fixedDateRange?: { $gte: string; $lte: string };
  dynamicPreset?: DynamicPreset;
  /** For custom_period: 'this' = past N days, 'next' = future N days */
  customDirection?: 'this' | 'next';
  /** Always stored in days (normalized from weeks/months at save time) */
  customNumber?: number;
  customUnit?: 'days';
  /** Which date operator was used: $between (default), $gte, or $lte */
  dateOperator?: '$between' | '$gte' | '$lte';
  _id?: string;
}

export interface SavedQuery {
  _id: string;
  isGlobal: boolean;
  business: string;
  addedBy: string;
  displayInChatbot: boolean;
  queryType: 'FEATHERS_SERVICE';
  querySubType: 'FIND';
  source: 'DASHBOARD';
  serviceName: 'invoices';
  query: Record<string, any>;
  dateFields: DateFieldConfig[];
  displayName: string;
  isArchived: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  /** True for system-generated default reports (NOB-based) */
  isDefault?: boolean;
  /** Nature of Business category for default report grouping */
  nob?: string;
}

export type BillType =
  | 'INVOICE'
  | 'PROFORMAINV'
  | 'CREDITNOTE'
  | 'PURCHASEORDER'
  | 'EXPENSERECEIPT'
  | 'DELIVERYCHALAN'
  | 'QUOTATION'
  | 'SALESORDER';

export type InvoiceStatus =
  | 'UNPAID'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'DRAFT';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'number-range' | 'boolean' | 'search-select';
  options?: FilterOption[];
  primary: boolean;
  placeholder?: string;
  operator?: '$in' | '$all';
  searchEndpoint?: string;
}

export interface InvoiceListResponse {
  data: any[];
  total: number;
  limit: number;
  skip: number;
}

export interface ClientOption {
  label: string;
  value: string;
}

export interface SystemReport {
  id: string;
  displayName: string;
  query: Record<string, any>;
  isSystem: true;
}
