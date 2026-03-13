import { NextRequest, NextResponse } from 'next/server';
import type { Sort } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { buildMongoQuery, parseQueryParams } from '@/lib/query-builder';

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

    // Build the MongoDB query (converts dates, strips $inOptions, etc.)
    const mongoFilter = buildMongoQuery(filter);

    // Add isolation filters unless explicitly querying removed documents
    if (mongoFilter.isRemoved === undefined) {
      mongoFilter.isRemoved = false;
    }
    if (mongoFilter.isHardRemoved === undefined) {
      mongoFilter.isHardRemoved = false;
    }

    const [data, total] = await Promise.all([
      db
        .collection('invoices')
        .find(mongoFilter)
        .sort(sort as Sort)
        .skip(skip)
        .limit(limit)
        .project({
          invoiceNumber: 1,
          billType: 1,
          status: 1,
          invoiceDate: 1,
          dueDate: 1,
          currency: 1,
          'totals.total': 1,
          'totals.subTotal': 1,
          'balance.due': 1,
          'billedTo.name': 1,
          'billedBy.name': 1,
          tags: 1,
          isExpenditure: 1,
          source: 1,
          igst: 1,
        })
        .toArray(),
      db.collection('invoices').countDocuments(mongoFilter),
    ]);

    return NextResponse.json({ data, total, limit, skip });
  } catch (error) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
