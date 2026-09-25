import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const content = searchParams.get('content')?.trim();
    const folder = searchParams.get('folder')?.trim() || '0';

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing content ID',
        },
        { status: 400 }
      );
    }

    const sourceUrl =
      `${SOURCE}?content=${encodeURIComponent(content)}` +
      `&folder=${encodeURIComponent(folder)}` +
      `&_t=${Date.now()}`;

    const response = await fetch(sourceUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Prep-Master',
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
          error: 'Source returned invalid JSON',
          status: response.status,
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Source returned ${response.status}`,
          sourceData: data,
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
        error: error?.message || 'Unable to load content',
      },
      { status: 502 }
    );
  }
}
