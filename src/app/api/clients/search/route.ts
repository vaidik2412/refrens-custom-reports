import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const pipeline: any[] = [
      // Only non-removed invoices
      { $match: { isRemoved: false, isHardRemoved: false, client: { $ne: null } } },
      // Filter by billedTo.name if search query provided
      ...(q
        ? [{ $match: { 'billedTo.name': { $regex: escapedQuery, $options: 'i' } } }]
        : []),
      // Group by client id to produce production-grade saved query filters
      {
        $group: {
          _id: '$client',
          label: { $first: '$billedTo.name' },
        },
      },
      // Filter out nulls
      { $match: { _id: { $ne: null } } },
      // Sort alphabetically
      { $sort: { label: 1 } },
      // Limit results
      { $limit: 20 },
      // Reshape for the $inOptions pattern — value = client ObjectId, label = billedTo.name
      {
        $project: {
          _id: 0,
          label: '$label',
          value: { $toString: '$_id' },
        },
      },
    ];

    const results = await db.collection('invoices').aggregate(pipeline).toArray();

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/clients/search error:', error);
    return NextResponse.json({ error: 'Failed to search clients' }, { status: 500 });
  }
}
