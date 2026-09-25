import { NextResponse } from 'next/server';

const S = 'https://nt.studybeepro.site/api/foy';

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

  const key = process.env.STUDYBEE_KEY;
  const device = process.env.STUDYBEE_DEVICE_ID;

  if (!key || !device) {
    return NextResponse.json(
      {
        success: false,
        error: 'Playback credentials are not configured on server.',
      },
      { status: 500 }
    );
  }

  try {
    const url =
      `${S}?content_id=${encodeURIComponent(contentId)}` +
      `&course_id=${encodeURIComponent(courseId)}` +
      `&key=${encodeURIComponent(key)}` +
      `&device_id=${encodeURIComponent(device)}`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Playback source returned invalid JSON.',
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
          error: `Playback source returned HTTP ${response.status}`,
          sourceData: data,
        },
        { status: 502 }
      );
    }

    const decrypted =
      data?.data?.decryptedData ||
      data?.decryptedData ||
      data?.data?.data?.decryptedData ||
      {};

    const playableUrl =
      decrypted?.file_url ||
      decrypted?.url ||
      data?.data?.file_url ||
      data?.data?.url ||
      data?.file_url ||
      data?.url ||
      null;

    if (!playableUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Playback response received, but no playable URL was found.',
          sourceData: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: playableUrl,
      type: decrypted?.file_type ?? null,
      videoType: decrypted?.video_type ?? null,
      isDrm: decrypted?.is_drm ?? null,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Unable to load playback.',
      },
      { status: 502 }
    );
  }
}
