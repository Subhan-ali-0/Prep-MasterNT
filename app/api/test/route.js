import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const testInstructions = searchParams.get('test_instructions');
    const testData = searchParams.get('test_data');

    let param = '';
    let value = '';

    if (testInstructions) {
      param = 'test_instructions';
      value = testInstructions;
    } else if (testData) {
      param = 'test_data';
      value = testData;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing test_instructions or test_data',
        },
        { status: 400 }
      );
    }

    const url =
      `${SOURCE}?${param}=${encodeURIComponent(value)}` +
      `&_t=${Date.now()}`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json, text/plain, */*',
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
          error: 'Test source returned invalid JSON',
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
          error: `Test source returned HTTP ${response.status}`,
          sourceData: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.data ?? data,
      responseCode: data?.responseCode ?? null,
      message: data?.message ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load test',
      },
      { status: 502 }
    );
  }
}
