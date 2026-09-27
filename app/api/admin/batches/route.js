import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '../../../../lib/mongodb';
import { validSession, COOKIE } from '../../../../lib/admin';
import { getSourceBatches, sanitizeOverride } from '../../../../lib/batches';

async function isAuthorized() {
  const cookieStore = await cookies();
  return validSession(cookieStore.get(COOKIE)?.value);
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

function fail(error, status = 500) {
  return NextResponse.json(
    { success: false, error: error?.message || String(error) },
    { status }
  );
}

function cleanId(value) {
  const id = String(value ?? '').trim();
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : '';
}

export async function GET() {
  if (!(await isAuthorized())) return unauthorized();

  try {
    const db = await getDb();

    const batches = await db
      .collection('batch_overrides')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      sourceBatches: getSourceBatches(),
      batches: batches.map((item) => ({
        ...item,
        _id: String(item._id),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(req) {
  if (!(await isAuthorized())) return unauthorized();

  try {
    const body = await req.json();
    const batchId = cleanId(body?.id ?? body?.batchId);

    if (!batchId) {
      return fail('Valid batch ID is required (letters, numbers, - or _).', 400);
    }

    const db = await getDb();

    await db.collection('batch_overrides').updateOne(
      { batchId },
      {
        $set: {
          ...sanitizeOverride(body),
          batchId,
          visible: body?.visible !== false,
          deleted: false,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(req) {
  if (!(await isAuthorized())) return unauthorized();

  try {
    const q = new URL(req.url).searchParams;
    const batchId = cleanId(q.get('id'));
    const mode = q.get('mode');

    if (!batchId) return fail('Valid batch ID is required.', 400);

    const db = await getDb();
    const collection = db.collection('batch_overrides');

    if (mode === 'reset') {
      await collection.deleteOne({ batchId });
    } else {
      await collection.updateOne(
        { batchId },
        { $set: { batchId, deleted: true, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
