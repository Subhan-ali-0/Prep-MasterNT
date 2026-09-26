import { NextResponse } from 'next/server';

const AUTHORIZED_M3U8_URL =
  'https://dyind2lqy6eys.cloudfront.net/file_library/videos/vod_non_drm_ios/4879492/1790259505_7642566065484080/1790259359206_45776334975246370_video_VOD.m3u8';

export async function GET(req) {
  try {
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

    return NextResponse.json({
      success: true,
      url: AUTHORIZED_M3U8_URL,
      type: 'm3u8',
      videoType: 4,
      isDrm: 0,
    });
  } catch (error) {
    console.error('Playback API error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Unable to load playback.',
      },
      { status: 500 }
    );
  }
}
