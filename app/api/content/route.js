import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

async function fetchJSON(url) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0',
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

    /*
     * First request
     */
    let result = await fetchJSON(url);

    /*
     * Retry once if upstream returned HTML/invalid JSON
     */
    if (!result.data) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      result = await fetchJSON(url);
    }

    /*
     * Upstream returned something other than JSON
     */
    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content source returned invalid JSON.',
          status: result.status,
          preview:
            result.text?.slice(0, 500) || '',
        },
        { status: 502 }
      );
    }

    /*
     * Upstream returned JSON but HTTP error
     */
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

    /*
     * Normal StudyBee response:
     *
     * {
     *   responseCode: 3006,
     *   message: "Course Content",
     *   data: [...]
     * }
     */

    const contentData = Array.isArray(
      result.data?.data
    )
      ? result.data.data
      : [];

    return NextResponse.json({
      success: true,
      data: contentData,
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
