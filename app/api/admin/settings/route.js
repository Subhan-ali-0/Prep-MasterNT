import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '../../../../lib/mongodb';
import { validSession, COOKIE } from '../../../../lib/admin';

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

  const settings = await db
    .collection('settings')
    .findOne({ key: 'main' });

  return NextResponse.json({
    success: true,
    settings: settings?.data || {},
  });
}
