import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';
const FALLBACK = 'https://nts.khatikgaurav38.workers.dev/';

async function requestJSON(url) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0',
    },
  });

  const text = await response.text();

  try {
    return {
      ok: response.ok,
      status: response.status,
      data: JSON.parse(text),
      text,
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      data: null,
      text,
    };
  }
}

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

    const query =
      `?content=${encodeURIComponent(content)}` +
      `&folder=${encodeURIComponent(folder)}` +
      `&_t=${Date.now()}`;

    /* -------------------------
       1. MAIN API
    ------------------------- */

    let result = await requestJSON(
      `${SOURCE}${query}`
    );

    /* -------------------------
       2. RETRY MAIN API
    ------------------------- */

    if (!result.data) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      result = await requestJSON(
        `${SOURCE}${query}`
      );
    }

    /* -------------------------
       3. FALLBACK WORKER
    ------------------------- */

    if (!result.data) {
      result = await requestJSON(
        `${FALLBACK}${query}`
      );
    }

    /* -------------------------
       INVALID RESPONSE
    ------------------------- */

    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Content source returned invalid JSON.',
          status: result.status,
          preview: result.text?.slice(0, 300) || '',
        },
        { status: 502 }
      );
    }

    /* -------------------------
       UPSTREAM ERROR
    ------------------------- */

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

    /* -------------------------
       NORMAL RESPONSE
    ------------------------- */

    return NextResponse.json({
      success: true,
      data: Array.isArray(result.data?.data)
        ? result.data.data
        : [],
      responseCode:
        result.data?.responseCode ?? null,
      message:
        result.data?.message ?? null,
    });

  } catch (error) {
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
