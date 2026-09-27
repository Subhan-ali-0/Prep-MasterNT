import { NextResponse } from 'next/server';

import { getSourceBatches, applyOverrides } from '../../../lib/batches';
import { getDb } from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

async function loadOverrides() {
  if (!process.env.MONGODB_URI) return [];

  try {
    const db = await getDb();
    return await db.collection('batch_overrides').find({}).toArray();
  } catch (error) {
    // Admin overrides are optional; the JSON catalogue still loads if Mongo is down.
    console.error('Batch overrides unavailable:', error?.message);
    return [];
  }
}

export async function GET() {
  try {
    const batches = applyOverrides(getSourceBatches(), await loadOverrides());

    return NextResponse.json(
      {
        success: true,
        batches,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Batches API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load batches.',
      },
      { status: 500 }
    );
  }
}
