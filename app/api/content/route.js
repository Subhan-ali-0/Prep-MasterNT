import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const content = searchParams.get('content');
    const folder = searchParams.get('folder') ?? '0';

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'content is required' },
        { status: 400 }
      );
    }

    const url = new URL(SOURCE);

    url.searchParams.set('content', content);
    url.searchParams.set('folder', folder);
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        accept: 'application/json'
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Content source returned ${response.status}`,
          details: text.slice(0, 500)
        },
        { status: 502 }
      );
    }

    let json;

    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Content source did not return JSON',
          details: text.slice(0, 500)
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: json.data ?? json
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load content.'
      },
      { status: 500 }
    );
  }
}
