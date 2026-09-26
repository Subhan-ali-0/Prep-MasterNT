import { NextResponse } from 'next/server';

const SOURCE =
  'https://nexttoppers.asmultiverse.in/api/nig';

function getUrl(req) {
  const q = new URL(req.url).searchParams;

  const content = q.get('content');
  const folder = q.get('folder') ?? '0';

  if (!content) {
    return null;
  }

  return (
    `${SOURCE}?content=${encodeURIComponent(content)}` +
    `&folder=${encodeURIComponent(folder)}` +
    `&_t=${Date.now()}`
  );
}

function extractData(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (Array.isArray(json?.data)) {
    return json.data;
  }

  if (Array.isArray(json?.data?.data)) {
    return json.data.data;
  }

  if (Array.isArray(json?.data?.contents)) {
    return json.data.contents;
  }

  if (Array.isArray(json?.contents)) {
    return json.contents;
  }

  if (Array.isArray(json?.data?.items)) {
    return json.data.items;
  }

  if (Array.isArray(json?.items)) {
    return json.items;
  }

  return [];
}

export async function GET(req) {
  try {
    const targetUrl = getUrl(req);

    if (!targetUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'content parameter is required.',
        },
        { status: 400 }
      );
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        Referer: 'https://nexttoppers.asmultiverse.in/',
        Origin: 'https://nexttoppers.asmultiverse.in',
      },
    });

    const text = await response.text();

    let json;

    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Content source returned invalid JSON.',
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
          error: `Content source returned HTTP ${response.status}.`,
          sourceData: json,
        },
        { status: 502 }
      );
    }

    const data = extractData(json);

    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length,
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Content API error:', error);

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
