import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/batches.json';

function normalize(x) {
  if (!x || typeof x !== 'object') return null;
  const id = x.id ?? x.course_id ?? x.courseId;
  if (id == null) return null;
  return {
    id: String(id),
    title: x.title ?? x.name ?? 'Untitled Batch',
    description: x.description ?? '',
    thumbnail: x.thumbnail ?? x.image ?? x.banner ?? '',
    mrp: x.mrp ?? '',
    offer_price: x.offer_price ?? x.price ?? '',
    price: x.price ?? x.offer_price ?? 'FREE',
    is_new: x.is_new ?? '',
    is_trending: x.is_trending ?? '',
    start_date: x.start_date ?? '',
    end_date: x.end_date ?? ''
  };
}

function extract(j) {
  let a = [];
  if (Array.isArray(j)) a.push(...j);
  if (j && typeof j === 'object') {
    for (const k of ['new', 'courses', 'batches']) {
      if (Array.isArray(j[k])) a.push(...j[k]);
    }
    if (Array.isArray(j.data)) a.push(...j.data);
    if (Array.isArray(j.data?.courses)) a.push(...j.data.courses);
    if (Array.isArray(j.data?.batches)) a.push(...j.data.batches);
  }
  const seen = new Set();
  return a.map(normalize).filter(Boolean).filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

export async function GET() {
  try {
    const r = await fetch(SOURCE, {
      cache: 'no-store',
      headers: { accept: 'application/json' }
    });
    if (!r.ok) {
      return NextResponse.json(
        { success: false, error: `Batch source returned ${r.status}` },
        { status: 502 }
      );
    }
    const j = await r.json();
    return NextResponse.json({ success: true, batches: extract(j) });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to load batches.' },
      { status: 502 }
    );
  }
}
