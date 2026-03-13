import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { buildSavedQueryPayload, normalizeDateFields } from '@/lib/saved-query-contract';

// Hardcoded IDs matching setupSavedQueries.cjs
const BUSINESS_ID = '66dfea2f0be47436d6ff2ca5';
const USER_ID = '64c8da6b59797bccd235f770';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);

    const serviceName = searchParams.get('serviceName') || 'invoices';
    const limit = Math.min(parseInt(searchParams.get('$limit') || '50', 10), 100);

    const queries = await db
      .collection('savedQueries')
      .find({
        serviceName,
        isArchived: { $ne: true },
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(queries);
  } catch (error) {
    console.error('GET /api/saved-queries error:', error);
    return NextResponse.json({ error: 'Failed to fetch saved queries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();

    if (!body.displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }

    const payload = buildSavedQueryPayload(body.query || {}, normalizeDateFields(body.dateFields || []));
    const now = new Date();
    const doc = {
      isGlobal: false,
      business: new ObjectId(BUSINESS_ID),
      addedBy: new ObjectId(USER_ID),
      displayInChatbot: false,
      queryType: body.queryType || 'FEATHERS_SERVICE',
      querySubType: body.querySubType || 'FIND',
      source: 'DASHBOARD',
      serviceName: body.serviceName || 'invoices',
      query: payload.query,
      dateFields: payload.dateFields.map((df: any) => ({
        ...df,
        _id: new ObjectId(),
      })),
      displayName: body.displayName,
      isArchived: false,
      description: body.description || '',
      ...(body.queryGroupTree ? { queryGroupTree: body.queryGroupTree } : {}),
      createdAt: now,
      updatedAt: now,
      __v: 0,
    };

    const result = await db.collection('savedQueries').insertOne(doc);
    const created = { ...doc, _id: result.insertedId };

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/saved-queries error:', error);
    return NextResponse.json({ error: 'Failed to create saved query' }, { status: 500 });
  }
}
