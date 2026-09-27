import batchesData from '../public/batches.json';

export const EDITABLE_FIELDS = [
  'title',
  'description',
  'thumbnail',
  'mrp',
  'offer_price',
  'price',
  'is_new',
  'is_trending',
  'start_date',
  'end_date',
];

export function normalizeBatch(x) {
  if (!x || typeof x !== 'object') return null;

  const id = x.id ?? x.course_id ?? x.courseId ?? x.batchId;

  if (id == null || id === '') return null;

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
    end_date: x.end_date ?? '',
  };
}

function extract(j) {
  const items = [];

  if (Array.isArray(j)) items.push(...j);

  if (j && typeof j === 'object') {
    for (const key of ['new', 'courses', 'batches']) {
      if (Array.isArray(j[key])) items.push(...j[key]);
    }
    if (Array.isArray(j.data)) items.push(...j.data);
    if (Array.isArray(j.data?.courses)) items.push(...j.data.courses);
    if (Array.isArray(j.data?.batches)) items.push(...j.data.batches);
  }

  const seen = new Set();

  return items
    .map(normalizeBatch)
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

export function getSourceBatches() {
  return extract(batchesData);
}

export function sanitizeOverride(input) {
  const out = {};

  for (const field of EDITABLE_FIELDS) {
    if (input?.[field] === undefined || input[field] === null) continue;
    out[field] = String(input[field]).slice(0, field === 'description' ? 20000 : 1000);
  }

  return out;
}

export function applyOverrides(source, overrides) {
  const byId = new Map(overrides.map((o) => [String(o.batchId), o]));
  const sourceIds = new Set(source.map((b) => b.id));

  const merged = source
    .map((batch) => {
      const override = byId.get(batch.id);
      if (!override) return batch;
      if (override.deleted || override.visible === false) return null;
      return { ...batch, ...sanitizeOverride(override) };
    })
    .filter(Boolean);

  for (const override of overrides) {
    const id = String(override.batchId);
    if (sourceIds.has(id) || override.deleted || override.visible === false) continue;
    const added = normalizeBatch({ id, ...sanitizeOverride(override) });
    if (added) merged.push(added);
  }

  return merged;
}
