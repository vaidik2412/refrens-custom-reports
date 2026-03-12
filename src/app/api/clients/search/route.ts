import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const pipeline: any[] = [
      // Only non-removed invoices
      { $match: { isRemoved: false, isHardRemoved: false } },
      // Filter by billedTo.name if search query provided
      ...(q
        ? [{ $match: { 'billedTo.name': { $regex: q, $options: 'i' } } }]
        : []),
      // Group by billedTo.name to get unique client names
      {
        $group: {
          _id: '$billedTo.name',
        },
      },
      // Filter out nulls
      { $match: { _id: { $ne: null } } },
      // Sort alphabetically
      { $sort: { _id: 1 } },
      // Limit results
      { $limit: 20 },
      // Reshape for the $inOptions pattern — value = billedTo.name
      {
        $project: {
          _id: 0,
          label: '$_id',
          value: '$_id',
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
