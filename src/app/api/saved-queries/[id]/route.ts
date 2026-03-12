import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid query ID' }, { status: 400 });
    }

    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Allow updating these fields
    if (body.query !== undefined) updateFields.query = body.query;
    if (body.dateFields !== undefined) {
      updateFields.dateFields = body.dateFields.map((df: any) => ({
        ...df,
        _id: df._id ? new ObjectId(df._id) : new ObjectId(),
      }));
    }
    if (body.displayName !== undefined) updateFields.displayName = body.displayName;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.isArchived !== undefined) updateFields.isArchived = body.isArchived;

    const result = await db.collection('savedQueries').findOneAndUpdate(
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
