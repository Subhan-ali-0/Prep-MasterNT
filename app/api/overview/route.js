import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'course_id is required',
        },
        { status: 400 }
      );
    }

    const url =
      `${SOURCE}?overview=${encodeURIComponent(courseId)}` +
      `&_t=${Date.now()}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
      },
    });

    const text = await response.text();

    let json;

    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Overview source returned invalid JSON.',
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Overview source returned HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error('Overview API error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Unable to load overview.',
      },
      { status: 502 }
    );
  }
}
