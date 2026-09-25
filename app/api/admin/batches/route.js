import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '../../../../../lib/mongodb';
import { validSession, COOKIE } from '../../../../../lib/admin';

async function isAuthorized() {
  const cookieStore = await cookies();
  return validSession(cookieStore.get(COOKIE)?.value);
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const db = await getDb();

  const batches = await db
    .collection('batch_overrides')
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({
    success: true,
    batches: batches.map((item) => ({
      ...item,
      _id: String(item._id),
    })),
  });
}
