import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

function normalizeItem(item, index) {
  if (!item || typeof item !== 'object') return null;

  const id =
    item.entity_id ??
    item.id ??
    item.folder_id ??
    item.folderId ??
    item.content_id ??
    item.contentId ??
    item.lecture_id ??
    item.lectureId ??
    index;

  const title =
    item.title ??
    item.name ??
    item.folder_name ??
    item.folderName ??
    item.content_name ??
    item.contentName ??
    item.lecture_name ??
    item.lectureName ??
    `Content ${index + 1}`;

  const type = String(item.type ?? '').toLowerCase();

  const data = item.data && typeof item.data === 'object'
    ? item.data
    : {};

  const url =
    item.video_url ??
    item.videoUrl ??
    item.hls_url ??
    item.hlsUrl ??
    item.play_url ??
    item.playUrl ??
    item.pdf_url ??
    item.pdfUrl ??
    item.url ??
    data.file_url ??
    '';

  const isFolder = type === 'folder';

  return {
    ...item,
    id: String(id),
    entity_id: String(item.entity_id ?? id),
    title: String(title),
    kind: isFolder ? 'folder' : url ? 'media' : 'item',
    url: String(url || ''),
    type,
    data
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const content = searchParams.get('content');
    const folder = searchParams.get('folder') || '0';

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing content/course id'
        },
        { status: 400 }
      );
    }

    const url =
      `${SOURCE}?content=${encodeURIComponent(content)}` +
      `&folder=${encodeURIComponent(folder)}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Content source returned ${response.status}`
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
          error: 'Content source returned invalid JSON.'
        },
        { status: 502 }
      );
    }

    const sourceData = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json)
        ? json
        : [];

    const items = sourceData
      .map(normalizeItem)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unable to load content.'
      },
      { status: 502 }
    );
  }
}
