import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const content = searchParams.get('content');
    const folder = searchParams.get('folder') || '0';

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing content ID',
        },
        { status: 400 }
      );
    }

    const url =
      `${SOURCE}?content=${encodeURIComponent(content)}` +
      `&folder=${encodeURIComponent(folder)}` +
      `&_t=${Date.now()}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
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
          error: 'Upstream returned invalid JSON',
          status: response.status,
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Upstream HTTP ${response.status}`,
          sourceData: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data || [],
      responseCode: data.responseCode,
      message: data.message,
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load content',
      },
      { status: 502 }
    );
  }
}
