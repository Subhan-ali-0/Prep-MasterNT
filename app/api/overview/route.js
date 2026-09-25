import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const course = searchParams.get('course');

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'course is required'
        },
        { status: 400 }
      );
    }

    const url = new URL(SOURCE);

    url.searchParams.set('overview', course);
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
          error: `Overview source returned ${response.status}`,
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
          error: 'Overview source did not return JSON',
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
        error: error?.message || 'Unable to load overview.'
      },
      { status: 500 }
    );
  }
}
