import { NextResponse } from 'next/server';

import batchesData from '../../../public/batches.json';

function normalize(x) {
  if (!x || typeof x !== 'object') return null;

  const id = x.id ?? x.course_id ?? x.courseId;

  if (id == null) return null;

  return {
    id: String(id),
    title: x.title ?? x.name ?? 'Untitled Batch',
    description: x.description ?? '',
    thumbnail:
      x.thumbnail ?? x.image ?? x.banner ?? '',
    mrp: x.mrp ?? '',
    offer_price:
      x.offer_price ?? x.price ?? '',
    price:
      x.price ?? x.offer_price ?? 'FREE',
    is_new: x.is_new ?? '',
    is_trending: x.is_trending ?? '',
    start_date: x.start_date ?? '',
    end_date: x.end_date ?? '',
  };
}

function extract(j) {
  let items = [];

  if (Array.isArray(j)) {
    items.push(...j);
  }

  if (j && typeof j === 'object') {
    for (const key of ['new', 'courses', 'batches']) {
      if (Array.isArray(j[key])) {
        items.push(...j[key]);
      }
    }

    if (Array.isArray(j.data)) {
      items.push(...j.data);
    }

    if (Array.isArray(j.data?.courses)) {
      items.push(...j.data.courses);
    }

    if (Array.isArray(j.data?.batches)) {
      items.push(...j.data.batches);
    }
  }

  const seen = new Set();

  return items
    .map(normalize)
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item.id)) return false;

      seen.add(item.id);
      return true;
    });
}

export async function GET() {
  try {
    const batches = extract(batchesData);

    return NextResponse.json(
      {
        success: true,
        batches,
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Batches API error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Unable to load batches.',
      },
      { status: 500 }
    );
  }
}
