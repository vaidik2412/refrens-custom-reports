import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const pipeline: any[] = [
      { $match: { isRemoved: false, isHardRemoved: false, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $match: { tags: { $type: 'string', $ne: '' } } },
      ...(q
        ? [{ $match: { tags: { $regex: escapedQuery, $options: 'i' } } }]
        : []),
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: q ? { _id: 1 } : { count: -1, _id: 1 } },
      { $limit: 20 },
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
    console.error('GET /api/tags/search error:', error);
    return NextResponse.json({ error: 'Failed to search tags' }, { status: 500 });
  }
}
