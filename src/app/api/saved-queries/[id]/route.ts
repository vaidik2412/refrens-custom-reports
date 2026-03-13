import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { buildSavedQueryPayload, normalizeDateFields } from '@/lib/saved-query-contract';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await request.json();
    const collection = db.collection('savedQueries');

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid query ID' }, { status: 400 });
    }

    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.query !== undefined || body.dateFields !== undefined) {
      const existing = await collection.findOne({ _id: new ObjectId(id) });
      if (!existing) {
        return NextResponse.json({ error: 'Saved query not found' }, { status: 404 });
      }

      const normalizedPayload = buildSavedQueryPayload(
        body.query !== undefined ? body.query : existing.query || {},
        normalizeDateFields(body.dateFields !== undefined ? body.dateFields : existing.dateFields || [])
      );

      if (body.query !== undefined) updateFields.query = normalizedPayload.query;
      if (body.dateFields !== undefined) {
        updateFields.dateFields = normalizedPayload.dateFields.map((df: any) => ({
          ...df,
          _id: df._id ? new ObjectId(df._id) : new ObjectId(),
        }));
      }
    }
    if (body.displayName !== undefined) updateFields.displayName = body.displayName;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.isArchived !== undefined) updateFields.isArchived = body.isArchived;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Saved query not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PATCH /api/saved-queries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update saved query' }, { status: 500 });
  }
}
