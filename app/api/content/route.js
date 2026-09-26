import { NextResponse } from 'next/server';

const SOURCE =
  'https://nexttoppers.asmultiverse.in/api/nig';

async function fetchJSON(url) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept:
        'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      Referer:
        'https://nexttoppers.asmultiverse.in/',
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: response.status,
      data: null,
      text,
    };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    text,
  };
}

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const content =
      searchParams.get('content');

    const folder =
      searchParams.get('folder') || '0';

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
      `${SOURCE}?content=${encodeURIComponent(
        content
      )}` +
      `&folder=${encodeURIComponent(folder)}`;

    let result = await fetchJSON(url);

    if (!result.data) {
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      result = await fetchJSON(url);
    }

    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Content source returned invalid JSON.',
          status: result.status,
          preview:
            result.text?.slice(0, 500) || '',
        },
        { status: 502 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Content source returned HTTP ${result.status}`,
          sourceData: result.data,
        },
        { status: 502 }
      );
    }

    const contentData =
      Array.isArray(result.data?.data)
        ? result.data.data
        : [];

    return NextResponse.json(
      {
        success: true,
        data: contentData,
        responseCode:
          result.data?.responseCode ?? null,
        message:
          result.data?.message ?? null,
      },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error(
      'Content API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Unable to load content.',
      },
      { status: 502 }
    );
  }
}
