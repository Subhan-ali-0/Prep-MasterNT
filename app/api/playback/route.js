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
      cache: 'no-store',
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Playback source returned ${response.status}`);
    }

    const data = JSON.parse(text);

    const playableUrl =
      data?.data?.decryptedData?.file_url || null;

    return NextResponse.json({
      success: true,
      url: playableUrl,
      type: data?.data?.decryptedData?.file_type ?? null,
      videoType: data?.data?.decryptedData?.video_type ?? null,
      isDrm: data?.data?.decryptedData?.is_drm ?? null,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unable to load playback.',
      },
      { status: 502 }
    );
  }
}
