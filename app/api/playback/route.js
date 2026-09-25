import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/foy';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const contentId = searchParams.get('content_id');
    const courseId = searchParams.get('course_id');

    if (!contentId || !courseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing content_id or course_id',
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
          error: 'Playback configuration is missing.',
        },
        { status: 500 }
      );
    }

    const url =
      `${SOURCE}?content_id=${encodeURIComponent(contentId)}` +
      `&course_id=${encodeURIComponent(courseId)}` +
      `&key=${encodeURIComponent(key)}` +
      `&device_id=${encodeURIComponent(deviceId)}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Playback source returned ${response.status}`,
        },
        { status: 502 }
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Playback source returned non-JSON data.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load playback.',
      },
      { status: 502 }
    );
  }
}
