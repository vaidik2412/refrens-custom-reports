import { NextRequest, NextResponse } from 'next/server';
import type { Sort } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { parseQueryParams } from '@/lib/query-builder';
import { buildInvoiceListQueryPlan, INVOICE_LIST_PROJECTION } from '@/lib/invoice-query';

function looksLikeObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const { filter, sort, limit, skip } = parseQueryParams(searchParams);

    // Backward-compat: legacy callers used `creator`; production uses `addedBy`.
    if (filter.creator !== undefined && filter.addedBy === undefined) {
      filter.addedBy = filter.creator;
      delete filter.creator;
    }

    // Backward-compat: legacy saved queries stored client names instead of client ids.
    if (filter.client?.$in && Array.isArray(filter.client.$in)) {
      const allLegacyNames = filter.client.$in.every((value: unknown) => !looksLikeObjectId(value));
      if (allLegacyNames) {
        filter['billedTo.name'] = filter.client;
        delete filter.client;
      }
    }

    const queryPlan = buildInvoiceListQueryPlan({
      filter,
      sort: sort as Sort,
      limit,
      skip,
    });

    let data;
    let total;

    if (queryPlan.mode === 'aggregate') {
      const [{ data: aggregateData = [], total: aggregateTotal = [] } = {}] = await db
        .collection('invoices')
        .aggregate(queryPlan.pipeline)
        .toArray();

      data = aggregateData;
      total = aggregateTotal[0]?.count || 0;
    } else {
      [data, total] = await Promise.all([
        db
          .collection('invoices')
          .find(queryPlan.mongoFilter)
          .sort(sort as Sort)
          .skip(skip)
          .limit(limit)
          .project(INVOICE_LIST_PROJECTION)
          .toArray(),
        db.collection('invoices').countDocuments(queryPlan.mongoFilter),
      ]);
    }

    return NextResponse.json({ data, total, limit, skip });
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
