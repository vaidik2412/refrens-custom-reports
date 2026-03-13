import type { Sort } from 'mongodb';
import { buildMongoQuery } from './query-builder';

export const INVOICE_LIST_PROJECTION = {
  invoiceNumber: 1,
  billType: 1,
  status: 1,
  invoiceDate: 1,
  dueDate: 1,
  currency: 1,
  taxType: 1,
  'totals.total': 1,
  'totals.subTotal': 1,
  'balance.due': 1,
  'billedTo.name': 1,
  'billedBy.name': 1,
  tags: 1,
  isExpenditure: 1,
  source: 1,
  igst: 1,
  reverseCharge: 1,
  placeOfSupply: 1,
  einvoiceGeneratedStatus: 1,
  'recurringInvoice.frequency': 1,
} as const;

const DERIVED_INVOICE_FILTER_KEYS = ['hasLinkedInvoice', 'adjustedCredit'] as const;

type DerivedInvoiceFilterKey = (typeof DERIVED_INVOICE_FILTER_KEYS)[number];
type DerivedInvoiceFilters = Partial<Record<DerivedInvoiceFilterKey, boolean>>;

function extractDerivedBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;

  if (
    value &&
    typeof value === 'object' &&
    '$eq' in value &&
    typeof (value as { $eq?: unknown }).$eq === 'boolean'
  ) {
    return (value as { $eq: boolean }).$eq;
  }

  return undefined;
}

function splitDerivedInvoiceFilters(filter: Record<string, any>): {
  baseFilter: Record<string, any>;
  derivedFilters: DerivedInvoiceFilters;
} {
  const baseFilter = { ...(filter || {}) };
  const derivedFilters: DerivedInvoiceFilters = {};

  for (const key of DERIVED_INVOICE_FILTER_KEYS) {
    const value = extractDerivedBoolean(baseFilter[key]);
    if (value !== undefined) {
      derivedFilters[key] = value;
    }
    delete baseFilter[key];
  }

  return { baseFilter, derivedFilters };
}

function mergeMatchClauses(...clauses: Array<Record<string, any> | null>): Record<string, any> {
  const nonEmptyClauses = clauses.filter(
    (clause): clause is Record<string, any> => clause !== null && Object.keys(clause).length > 0
  );

  if (nonEmptyClauses.length === 0) return {};
  if (nonEmptyClauses.length === 1) return nonEmptyClauses[0];

  return { $and: nonEmptyClauses };
}

function buildAdjustedCreditClause(value: boolean | undefined): Record<string, any> | null {
  if (value === undefined) return null;

  const activeCreditClaimCount = {
    $size: {
      $filter: {
        input: { $ifNull: ['$creditClaims', []] },
        as: 'claim',
        cond: {
          $ne: ['$$claim.isRemoved', true],
        },
      },
    },
  };

  if (value) {
    return {
      $expr: {
        $gt: [activeCreditClaimCount, 0],
      },
    };
  }

  return {
    $expr: {
      $eq: [activeCreditClaimCount, 0],
    },
  };
}

function buildHasLinkedInvoiceStages(value: boolean) {
  return [
    {
      $lookup: {
        from: 'invoices',
        let: {
          linkedDocumentIds: { $ifNull: ['$linkedDocuments', []] },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ['$_id', '$$linkedDocumentIds'] },
                  { $eq: ['$billType', 'INVOICE'] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: '__linkedInvoiceDocuments',
      },
    },
    {
      $lookup: {
        from: 'invoices',
        let: {
          sourceDocumentId: '$convertedFrom',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$sourceDocumentId'] },
                  { $eq: ['$billType', 'INVOICE'] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: '__sourceInvoiceDocument',
      },
    },
    {
      $lookup: {
        from: 'invoices',
        let: {
          currentDocumentId: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$convertedFrom', '$$currentDocumentId'] },
                  { $eq: ['$billType', 'INVOICE'] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: '__childInvoiceDocuments',
      },
    },
    {
      $addFields: {
        __hasLinkedInvoice: {
          $or: [
            {
              $gt: [
                {
                  $size: { $ifNull: ['$linkedInvoices', []] },
                },
                0,
              ],
            },
            {
              $gt: [
                {
                  $size: { $ifNull: ['$__linkedInvoiceDocuments', []] },
                },
                0,
              ],
            },
            {
              $gt: [
                {
                  $size: { $ifNull: ['$__sourceInvoiceDocument', []] },
                },
                0,
              ],
            },
            {
              $gt: [
                {
                  $size: { $ifNull: ['$__childInvoiceDocuments', []] },
                },
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $match: {
        __hasLinkedInvoice: value,
      },
    },
  ];
}

type InvoiceListQueryPlan = {
  mode: 'find';
  mongoFilter: Record<string, any>;
} | {
  mode: 'aggregate';
  pipeline: Record<string, any>[];
};

interface BuildInvoiceListQueryPlanArgs {
  filter: Record<string, any>;
  sort: Sort;
  limit: number;
  skip: number;
}

export function buildInvoiceListQueryPlan({
  filter,
  sort,
  limit,
  skip,
}: BuildInvoiceListQueryPlanArgs): InvoiceListQueryPlan {
  const { baseFilter, derivedFilters } = splitDerivedInvoiceFilters(filter);
  const mongoFilter = buildMongoQuery(baseFilter);

  if (mongoFilter.isRemoved === undefined) {
    mongoFilter.isRemoved = false;
  }
  if (mongoFilter.isHardRemoved === undefined) {
    mongoFilter.isHardRemoved = false;
  }

  const baseMatch = mergeMatchClauses(
    mongoFilter,
    buildAdjustedCreditClause(derivedFilters.adjustedCredit)
  );

  if (derivedFilters.hasLinkedInvoice === undefined) {
    return {
      mode: 'find',
      mongoFilter: baseMatch,
    };
  }

  return {
    mode: 'aggregate',
    pipeline: [
      { $match: baseMatch },
      ...buildHasLinkedInvoiceStages(derivedFilters.hasLinkedInvoice),
      {
        $facet: {
          data: [
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            { $project: INVOICE_LIST_PROJECTION },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ],
  };
}
