import { NextResponse } from 'next/server';

const SOURCE = 'https://nt.studybeepro.site/api/nig';

function collectItems(value, output = []) {
  if (value == null) return output;

  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === 'object') {
        output.push(item);
      }
      collectItems(item, output);
    }
    return output;
  }

  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const child = value[key];

      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object') {
            output.push(item);
          }
        }
      }

      collectItems(child, output);
    }
  }

  return output;
}

function normalize(item, index) {
  const id =
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
    item.subject_name ??
    item.subjectName ??
    `Content ${index + 1}`;

  const type = String(
    item.type ??
    item.content_type ??
    item.contentType ??
    item.kind ??
    ''
  ).toLowerCase();

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
    '';

  const folderId =
    item.folder_id ??
    item.folderId ??
    item.parent_folder_id ??
    item.parentFolderId;

  const isFolder =
    type.includes('folder') ||
    type.includes('directory') ||
    type.includes('subject') ||
    type.includes('chapter') ||
    item.is_folder === true ||
    item.isFolder === true;

  return {
    ...item,
    id: String(id),
    title: String(title),
    kind: isFolder ? 'folder' : url ? 'media' : 'item',
    url: String(url || ''),
    folder_id: folderId ?? null
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

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Content source returned non-JSON data.'
        },
        { status: 502 }
      );
    }

    const rawItems = collectItems(data);

    const items = [];
    const seen = new Set();

    for (const item of rawItems) {
      const normalized = normalize(item, items.length);

      if (!seen.has(normalized.id)) {
        seen.add(normalized.id);
        items.push(normalized);
      }
    }

    return NextResponse.json({
      success: true,
      data: items,
      raw: data
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
