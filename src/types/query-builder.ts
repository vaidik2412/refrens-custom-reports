// ── Operators (index-friendly only — no $ne, $nin, $exists) ─────────

export type Operator =
  | '$eq'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$in'
  | '$all'
  | '$regex'
  | '$between';

// ── Field Types ─────────────────────────────────────────────────────

export type FieldType =
  | 'string'
  | 'enum'
  | 'number'
  | 'date'
  | 'boolean'
  | 'search'
  | 'multi-enum';

export type FieldCategory = 'core' | 'financial' | 'tax' | 'metadata';

// ── Core Condition Model ────────────────────────────────────────────

export interface QueryCondition {
  id: string;
  field: string;
  operator: Operator;
  value: any;
}

// ── Group container ─────────────────────────────────────────────────

export type LogicalOperator = 'AND' | 'OR';

export interface QueryGroup {
  id: string;
  logicalOperator: LogicalOperator;
  conditions: QueryCondition[];
  groups: QueryGroup[];
}

// ── Field Registry Entry ────────────────────────────────────────────

export interface FieldRegistryEntry {
  key: string;
  label: string;
  fieldType: FieldType;
  operators: Operator[];
  defaultOperator: Operator;
  options?: Array<{ label: string; value: string }>;
  searchEndpoint?: string;
  category: FieldCategory;
  mongoField?: string;
  /** If present, field only shows for these bill types. Absent = universal (all types). */
  billTypes?: string[];
}
