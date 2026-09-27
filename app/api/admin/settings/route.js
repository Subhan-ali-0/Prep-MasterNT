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

const SETTING_FIELDS = ['appName', 'telegramUrl', 'ownerContact', 'heroTitle', 'heroSubtitle'];

export async function PUT(req) {
  if (!(await isAuthorized())) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const data = {};

    for (const field of SETTING_FIELDS) {
      if (typeof body?.[field] === 'string') data[field] = body[field].slice(0, 500);
    }

    const db = await getDb();

    await db
      .collection('settings')
      .updateOne(
        { key: 'main' },
        { $set: { key: 'main', data, updatedAt: new Date() } },
        { upsert: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to save settings.' },
      { status: 500 }
    );
  }
}
