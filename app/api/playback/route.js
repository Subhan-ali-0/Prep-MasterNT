
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
          error: 'content_id and course_id are required'
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
          error: 'Playback environment variables are missing.'
        },
        { status: 500 }
      );
    }

    const url = new URL(SOURCE);

    url.searchParams.set('content_id', contentId);
    url.searchParams.set('course_id', courseId);
    url.searchParams.set('key', key);
    url.searchParams.set('device_id', deviceId);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        accept: 'application/json'
      }
    });

    const text = await response.text();

    let json;

    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Playback source did not return JSON'
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Playback source returned ${response.status}`,
          data: json
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: json
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load playback.'
      },
      { status: 500 }
    );
  }
}
