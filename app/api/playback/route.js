import { NextResponse } from 'next/server';

// The previous version returned one hardcoded stream for every content_id,
// which played the wrong video. Until an authorized per-content playback
// source is wired up here (using STUDYBEE_KEY / STUDYBEE_DEVICE_ID server-side),
// this route reports that honestly instead of inventing a URL.

export async function GET(req) {
  const q = new URL(req.url).searchParams;

  const contentId = q.get('content_id');
  const courseId = q.get('course_id');

  if (!contentId || !courseId) {
    return NextResponse.json(
      {
        success: false,
        error: 'content_id and course_id are required',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Is video ke liye authorized playback URL available nahi hai.',
    },
    { status: 501 }
  );
}
