import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

/**
 * POST /api/saved-queries/find
 *
 * Feathers-style FIND endpoint — returns multiple documents with pagination.
 * Body: { serviceName?, $limit?, $skip?, isGlobal? }
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    const serviceName = body.serviceName || 'invoices';
    const limit = Math.min(body.$limit || 50, 100);
    const skip = body.$skip || 0;

    const filter: Record<string, any> = {
      serviceName,
      isArchived: { $ne: true },
    };

    // Exclude global reports when explicitly requested
    if (body.isGlobal === false) {
      filter.isGlobal = { $ne: true };
    }

    const [data, total] = await Promise.all([
      db
        .collection('savedQueries')
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('savedQueries').countDocuments(filter),
    ]);

    return NextResponse.json({ total, limit, skip, data });
  } catch (error) {
    console.error('POST /api/saved-queries/find error:', error);
    return NextResponse.json(
      { error: 'Failed to find saved queries' },
      { status: 500 }
    );
  }
}
