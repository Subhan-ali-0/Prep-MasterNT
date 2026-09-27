import { NextResponse } from 'next/server';

const SOURCE =
  'https://nt.studybeepro.site/api/nig';

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const courseId = q.get('course');

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'course parameter is required.',
        },
        { status: 400 }
      );
    }

    const targetUrl =
      `${SOURCE}?overview=${encodeURIComponent(courseId)}` +
      `&_t=${Date.now()}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept:
          'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        Referer:
          'https://nt.studybeepro.site/',
        Origin:
          'https://nt.studybeepro.site',
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
          error:
            'Overview source returned invalid JSON.',
          status: response.status,
          preview: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Overview source returned HTTP ${response.status}.`,
          sourceData: json,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: json,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(
      'Overview API error:',
      error
    );

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
