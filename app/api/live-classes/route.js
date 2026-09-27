import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/play';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const courseId = searchParams.get('course_id');

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'course_id is required.',
        },
        { status: 400 }
      );
    }

    const key = process.env.STUDYBEE_KEY;
    const deviceId = process.env.STUDYBEE_DEVICE_ID;

    if (!key || !deviceId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Live classes credentials are not configured on server.',
        },
        { status: 500 }
      );
    }

    const url =
      `${SOURCE}?action=classes` +
      `&type=1` +
      `&course_id=${encodeURIComponent(courseId)}` +
      `&key=${encodeURIComponent(key)}` +
      `&device_id=${encodeURIComponent(deviceId)}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
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
            'Live classes source returned invalid JSON.',
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Live classes source returned HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error(
      'Live classes API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Unable to load live classes.',
      },
      { status: 502 }
    );
  }
}
