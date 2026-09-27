import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LOAD_FAILED = 'Video load nahi ho saka.';
const URL_MISSING = 'Playable video URL available nahi hai.';

function fail(error, status) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

function detectType(url, hint) {
  if (hint) return String(hint).toLowerCase();
  if (/\.m3u8(\?|$)/i.test(url)) return 'm3u8';
  if (/\.mpd(\?|$)/i.test(url)) return 'mpd';
  return 'mp4';
}

function pickUrl(json) {
  const d = json?.data ?? {};
  return (
    json?.url ??
    json?.playback_url ??
    d?.url ??
    d?.playback_url ??
    d?.file_url ??
    d?.link ??
    null
  );
}

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const contentId = q.get('content_id')?.trim();
  const courseId = q.get('course_id')?.trim();

  if (!contentId || !courseId || !/^\d+$/.test(contentId) || !/^\d+$/.test(courseId)) {
    return fail('content_id and course_id are required', 400);
  }

  const source = process.env.PLAYBACK_API_URL;
  const key = process.env.STUDYBEE_KEY;
  const device = process.env.STUDYBEE_DEVICE_ID;

  if (!source || !key || !device) {
    return fail(LOAD_FAILED, 500);
  }

  try {
    const upstream = new URL(source);
    upstream.searchParams.set('content_id', contentId);
    upstream.searchParams.set('course_id', courseId);

    const response = await fetch(upstream, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'x-api-key': key,
        'x-device-id': device,
      },
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json || json.success === false) {
      return fail(LOAD_FAILED, response.status === 403 ? 403 : 502);
    }

    const url = pickUrl(json);
    if (!url || typeof url !== 'string' || !/^https:\/\//i.test(url)) {
      return fail(URL_MISSING, 404);
    }

    return NextResponse.json(
      {
        success: true,
        url,
        type: detectType(url, json?.type ?? json?.data?.type),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return fail(LOAD_FAILED, 502);
  }
}
