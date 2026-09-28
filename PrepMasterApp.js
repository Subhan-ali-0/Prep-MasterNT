'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import PdfPlayer from './PdfPlayer';
import HlsVideo from './HlsVideo';
import { sanitizeHtml } from './lib/sanitize-html';

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ||
  'https://t.me/prepmaster0';

const OWNER_CONTACT =
  process.env.NEXT_PUBLIC_OWNER_CONTACT ||
  'https://t.me/Subhanali011';

/* =========================================================
   HELPERS
========================================================= */

/* Folder / file (content) ID. Never falls back to course_id. */
function getContentId(item) {
  return String(
    item?.entity_id ??
      item?.data?.id ??
      item?.id ??
      ''
  );
}

function isLocked(item) {
  return false;
}

function sumCount(count) {
  if (count == null) return 0;
  if (typeof count === 'number') return count;

  const free = Number(count?.free) || 0;
  const paid = Number(count?.paid) || 0;
  const total = Number(count?.total) || 0;

  return free + paid || total;
}

function isFlagOn(value) {
  if (value == null || value === '') return false;

  const v = String(value).toLowerCase();

  return v !== '0' && v !== 'false' && v !== 'no';
}

function formatPrice(value) {
  if (value == null || value === '') return '';

  const n = Number(value);

  if (Number.isNaN(n)) return String(value);
  if (n === 0) return 'FREE';

  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDateTime(value) {
  if (!value) return '';

  const number = Number(value);
  const date = Number.isNaN(number)
    ? new Date(value)
    : new Date(number < 10000000000 ? number * 1000 : number);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getId(item) {
  return String(
    item?.id ??
      item?.course_id ??
      item?.courseId ??
      item?.entity_id ??
      item?.data?.id ??
      ''
  );
}

function getTitle(item) {
  return (
    item?.title ??
    item?.name ??
    item?.data?.title ??
    'Untitled'
  );
}

function getDescription(item) {
  return (
    item?.description ??
    item?.data?.description ??
    ''
  );
}

function getPrice(item) {
  return (
    item?.offer_price ??
    item?.price ??
    item?.data?.offer_price ??
    ''
  );
}

function getBatchImage(item) {
  return (
    item?.thumbnail ??
    item?.image ??
    item?.banner ??
    item?.data?.thumbnail ??
    ''
  );
}

function isFolder(item) {
  return (
    item?.type === 'folder' ||
    item?.data?.type === 'folder'
  );
}

function getFileType(item) {
  return (
    item?.file_type ??
    item?.data?.file_type ??
    ''
  );
}

function getVideoType(item) {
  return (
    item?.video_type ??
    item?.data?.video_type ??
    ''
  );
}

function getContentUrl(item) {
  return (
    item?.file_url ??
    item?.url ??
    item?.data?.file_url ??
    item?.data?.url ??
    ''
  );
}

function isYouTubeUrl(url) {
  if (!url) return false;

  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be')
  );
}

function isHlsOrDashUrl(url) {
  if (!url) return false;

  return (
    url.includes('.m3u8') ||
    url.includes('.mpd')
  );
}

function isVideo(item) {
  const type = String(getFileType(item)).toLowerCase();
  const videoType = String(getVideoType(item)).toLowerCase();
  const url = getContentUrl(item);

  return (
    type === 'video' ||
    type === '2' ||
    videoType === '1' ||
    videoType === '4' ||
    isYouTubeUrl(url) ||
    isHlsOrDashUrl(url) ||
    /\.(mp4|webm|m3u8|mpd)(\?|$)/i.test(url)
  );
}

function isPdf(item) {
  const type = String(getFileType(item)).toLowerCase();
  const url = getContentUrl(item);

  return (
    type === 'pdf' ||
    type === '3' ||
    /\.pdf(\?|$)/i.test(url)
  );
}

function getPdfUrl(item) {
  return (
    item?.file_url ??
    item?.pdf ??
    item?.data?.file_url ??
    item?.data?.pdf ??
    ''
  );
}

function isTest(item) {
  const type = String(
    item?.type ??
      item?.content_type ??
      item?.data?.content_type ??
      ''
  ).toLowerCase();

  const fileType = String(
    getFileType(item)
  ).toLowerCase();

  return (
    type === 'test' ||
    type === 'quiz' ||
    fileType === 'test'
  );
}

function extractTestId(item) {
  return String(
    item?.test_id ??
      item?.entity_id ??
      item?.id ??
      item?.data?.id ??
      ''
  );
}

function getTestQuestions(item) {
  return (
    item?.questions ??
    item?.data?.questions ??
    []
  );
}

function getQuestionText(question) {
  return (
    question?.question ??
    question?.question_text ??
    question?.title ??
    ''
  );
}

function getOptions(question) {
  return (
    question?.options ??
    question?.answers ??
    []
  );
}

function formatDate(value) {
  if (!value) return '';

  const number = Number(value);

  if (!Number.isNaN(number)) {
    const date = new Date(
      number < 10000000000
        ? number * 1000
        : number
    );

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return String(value);
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

function extractOverviewDetails(json) {
  const sections = toArray(json?.data);

  const overview = sections.find(
    (item) => item?.type === 'overview'
  );

  const layouts = toArray(overview?.data);

  const detailsLayout = layouts.find(
    (item) => item?.layout_type === 'details'
  );

  const details = toArray(
    detailsLayout?.layout_data
  );

  return {
    layouts,
    course: details[0] ?? null,
  };
}

function extractLiveClasses(json) {
  const candidates = [
    json?.data,
    json?.data?.classes,
    json?.data?.data,
    json?.data?.items,
    json?.classes,
    json?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function getLiveTitle(item) {
  return (
    item?.title ??
    item?.name ??
    item?.class_name ??
    item?.topic ??
    item?.data?.title ??
    item?.data?.name ??
    'Live Class'
  );
}

function getLiveTeacher(item) {
  return (
    item?.teacher_name ??
    item?.teacher ??
    item?.faculty ??
    item?.data?.teacher_name ??
    item?.data?.teacher ??
    ''
  );
}

function getLiveDate(item) {
  return (
    item?.date ??
    item?.class_date ??
    item?.start_date ??
    item?.scheduled_at ??
    item?.start_time ??
    item?.data?.date ??
    item?.data?.class_date ??
    ''
  );
}

function getLiveUrl(item) {
  return (
    item?.live_url ??
    item?.join_url ??
    item?.meeting_url ??
    item?.url ??
    item?.link ??
    item?.dynamic_link ??
    item?.data?.live_url ??
    item?.data?.join_url ??
    item?.data?.url ??
    ''
  );
}

function getLiveStatus(item) {
  const status =
    item?.status_text ??
    item?.live_status ??
    item?.status ??
    item?.data?.status ??
    '';

  if (typeof status === 'string') return status;
  if (isFlagOn(item?.is_live)) return 'Live';

  return '';
}

function getLiveThumbnail(item) {
  return (
    item?.thumbnail ??
    item?.image ??
    item?.data?.thumbnail ??
    ''
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function PrepMasterApp() {
  const [page, setPage] = useState('batches');

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [enrolled, setEnrolled] = useState([]);

  const [selectedBatch, setSelectedBatch] =
    useState(null);

  const [activeBatchTab, setActiveBatchTab] =
    useState('overview');

  /* ---------------- CONTENT ---------------- */

  const [contentItems, setContentItems] =
    useState([]);

  const [contentLoading, setContentLoading] =
    useState(false);

  const [contentError, setContentError] =
    useState('');

  const [currentFolder, setCurrentFolder] =
    useState('0');

  const [folderStack, setFolderStack] =
    useState([]);

  /* ---------------- OVERVIEW ---------------- */

  const [overviewData, setOverviewData] =
    useState(null);

  const [overviewLoading, setOverviewLoading] =
    useState(false);

  const [overviewError, setOverviewError] =
    useState('');

  /* ---------------- LIVE CLASSES ---------------- */

  const [liveClasses, setLiveClasses] =
    useState([]);

  const [liveLoading, setLiveLoading] =
    useState(false);

  const [liveError, setLiveError] =
    useState('');

  /* ---------------- PLAYER ---------------- */

  const [player, setPlayer] = useState(null);
  const [playerLoading, setPlayerLoading] =
    useState(false);
  const [playerError, setPlayerError] =
    useState('');

  /* ---------------- MENU / POPUPS ---------------- */

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [enrollPopup, setEnrollPopup] =
    useState(false);

  const [telegramPopup, setTelegramPopup] =
    useState(false);

  /* ---------------- TEST ---------------- */

  const [test, setTest] = useState(null);
  const [testAnswers, setTestAnswers] =
    useState({});
  const [testResult, setTestResult] =
    useState(null);

  const [returnPage, setReturnPage] =
    useState('batches');

  const [playerErrorTitle, setPlayerErrorTitle] =
    useState('Playback Error');

  const contentRequestRef = useRef(0);
  const playbackRequestRef = useRef(0);

  /* =========================================================
     LOAD ENROLLED
  ========================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('pm_enrolled');

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setEnrolled(parsed);
        }
      }
    } catch {
      setEnrolled([]);
    }
  }, []);

  /* =========================================================
     SAVE ENROLLED
  ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        'pm_enrolled',
        JSON.stringify(enrolled)
      );
    } catch {}
  }, [enrolled]);

  /* =========================================================
     TELEGRAM POPUP
  ========================================================= */

  useEffect(() => {
    try {
      const shown =
        localStorage.getItem(
          'pm_telegram_popup_shown'
        );

      if (!shown) {
        setTelegramPopup(true);

        localStorage.setItem(
          'pm_telegram_popup_shown',
          '1'
        );
      }
    } catch {}
  }, []);

  /* =========================================================
     LOAD BATCHES
  ========================================================= */

  async function loadBatches() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/batches',
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error ||
            'Unable to load batches.'
        );
      }

      setBatches(
        Array.isArray(json?.batches)
          ? json.batches
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load batches.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredBatches = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return batches;
    }

    return batches.filter((batch) => {
      const title =
        getTitle(batch).toLowerCase();

      const description =
        getDescription(batch).toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query)
      );
    });
  }, [batches, search]);

  /* =========================================================
     OVERVIEW
  ========================================================= */

  async function loadOverview(courseId) {
    if (!courseId) return;

    try {
      setOverviewLoading(true);
      setOverviewError('');

      const response = await fetch(
        `/api/overview?course_id=${encodeURIComponent(
          courseId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(
          json?.error ||
            'Unable to load overview.'
        );
      }

      const parsed =
        extractOverviewDetails(json);

      setOverviewData(parsed);
    } catch (err) {
      setOverviewData(null);

      setOverviewError(
        err?.message ||
          'Unable to load overview.'
      );
    } finally {
      setOverviewLoading(false);
    }
  }

  /* =========================================================
     CONTENT
  ========================================================= */

  async function loadContent(
    courseId,
    folderId = '0'
  ) {
    if (!courseId) return;

    const requestId = ++contentRequestRef.current;

    try {
      setContentLoading(true);
      setContentError('');
      setContentItems([]);

      const response = await fetch(
        `/api/content?content=${encodeURIComponent(
          courseId
        )}&folder=${encodeURIComponent(
          folderId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (requestId !== contentRequestRef.current) return;

      if (!response.ok || json?.success === false) {
        throw new Error(
          json?.error ||
            'Unable to load content.'
        );
      }

      setContentItems(
        Array.isArray(json?.data)
          ? json.data
          : []
      );
    } catch (err) {
      if (requestId !== contentRequestRef.current) return;

      setContentItems([]);

      setContentError(
        err?.message ||
          'Unable to load content.'
      );
    } finally {
      if (requestId === contentRequestRef.current) {
        setContentLoading(false);
      }
    }
  }

  /* =========================================================
     LIVE CLASSES
  ========================================================= */

  async function loadLiveClasses(courseId) {
    if (!courseId) return;

    try {
      setLiveLoading(true);
      setLiveError('');

      const response = await fetch(
        `/api/live-classes?course_id=${encodeURIComponent(
          courseId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || json?.success === false) {
        throw new Error(
          json?.error ||
            'Unable to load live classes.'
        );
      }

      setLiveClasses(
        extractLiveClasses(json)
      );
    } catch (err) {
      setLiveClasses([]);

      setLiveError(
        err?.message ||
          'Unable to load live classes.'
      );
    } finally {
      setLiveLoading(false);
    }
  }

  /* =========================================================
     OPEN BATCH
  ========================================================= */

  async function openBatch(batch) {
    const courseId = getId(batch);

    if (page !== 'batch') setReturnPage(page);

    setSelectedBatch(batch);

    setActiveBatchTab('overview');

    setCurrentFolder('0');
    setFolderStack([]);

    setContentItems([]);

    setOverviewData(null);
    setOverviewError('');

    setLiveClasses([]);
    setLiveError('');

    setPlayer(null);
    setPlayerError('');

    setPage('batch');

    await Promise.all([
      loadOverview(courseId),
      loadContent(courseId, '0'),
    ]);
  }

  /* =========================================================
     CHANGE BATCH TAB
  ========================================================= */

  async function changeBatchTab(tab) {
    setActiveBatchTab(tab);

    if (!selectedBatch) return;

    const courseId =
      getId(selectedBatch);

    if (tab === 'overview') {
      if (!overviewData) {
        await loadOverview(courseId);
      }

      return;
    }

    if (tab === 'content') {
      if (!contentItems.length) {
        await loadContent(
          courseId,
          currentFolder
        );
      }

      return;
    }

    if (tab === 'live') {
      await loadLiveClasses(courseId);
    }
  }

  /* =========================================================
     FOLDER
  ========================================================= */

  /* folderStack holds every folder entered, root excluded: [{ id, title }] */

  async function openFolder(item) {
    if (!selectedBatch) return;

    const folderId = getContentId(item);

    if (!folderId || folderId === currentFolder) return;

    setFolderStack((previous) => [
      ...previous,
      { id: folderId, title: getTitle(item) },
    ]);

    setCurrentFolder(folderId);

    await loadContent(
      getId(selectedBatch),
      folderId
    );
  }

  async function goToFolderDepth(depth) {
    if (!selectedBatch) return;

    const next = folderStack.slice(
      0,
      Math.max(0, depth)
    );

    const folderId = next.length
      ? next[next.length - 1].id
      : '0';

    setFolderStack(next);
    setCurrentFolder(folderId);

    await loadContent(
      getId(selectedBatch),
      folderId
    );
  }

  async function goBackFolder() {
    await goToFolderDepth(folderStack.length - 1);
  }

  /* =========================================================
     PLAYBACK
  ========================================================= */

  async function openVideo(item) {
    const directUrl =
      getContentUrl(item);

    const title = getTitle(item);

    setPlayerError('');
    setPlayerLoading(false);

    /* Direct YouTube */

    if (isYouTubeUrl(directUrl)) {
      let embedUrl = directUrl;

      try {
        const url =
          new URL(directUrl);

        if (
          url.hostname.includes(
            'youtu.be'
          )
        ) {
          embedUrl =
            `https://www.youtube.com/embed/${url.pathname.replace(
              '/',
              ''
            )}`;
        } else {
          const videoId =
            url.searchParams.get(
              'v'
            );

          if (videoId) {
            embedUrl =
              `https://www.youtube.com/embed/${videoId}`;
          }
        }
      } catch {}

      setPlayer({
        type: 'youtube',
        url: embedUrl,
        title,
      });

      return;
    }

    /* Direct URL returned by the content API (mp4 or HLS) */

    if (directUrl) {
      if (/\.mpd(\?|$)/i.test(directUrl)) {
        setPlayerErrorTitle('Playback Error');
        setPlayerError('DASH (.mpd) stream abhi supported nahi hai.');
        return;
      }

      setPlayer({
        type: 'video',
        url: directUrl,
        title,
      });

      return;
    }

    /* Authorized backend playback */

    const contentId = getContentId(item);

    const courseId = String(
      selectedBatch
        ? getId(selectedBatch)
        : item?.course_id ?? ''
    );

    setPlayerErrorTitle('Playback Error');

    if (!contentId || !courseId) {
      setPlayerError(
        'Playback information is not available.'
      );

      return;
    }

    const requestId = ++playbackRequestRef.current;

    try {
      setPlayer(null);
      setPlayerLoading(true);

      const response = await fetch(
        `/api/playback?content_id=${encodeURIComponent(
          contentId
        )}&course_id=${encodeURIComponent(
          courseId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response
        .json()
        .catch(() => null);

      if (requestId !== playbackRequestRef.current) return;

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error ||
            'Video load nahi ho saka.'
        );
      }

      const playableUrl = json?.url || null;

      if (!playableUrl) {
        throw new Error(
          'Playable video URL available nahi hai.'
        );
      }

      if (json?.type === 'mpd') {
        throw new Error(
          'DASH (.mpd) stream abhi supported nahi hai.'
        );
      }

      setPlayer({
        type: 'video',
        url: playableUrl,
        streamType: json?.type || '',
        contentId,
        title,
      });
    } catch (err) {
      if (requestId !== playbackRequestRef.current) return;
      setPlayerError(
        err?.message ||
          'Video load nahi ho saka.'
      );
    } finally {
      if (requestId === playbackRequestRef.current) {
        setPlayerLoading(false);
      }
    }
  }

  /* =========================================================
     PDF
  ========================================================= */

  function openPdf(item) {
    const url = getPdfUrl(item);

    if (!url) {
      setPlayerErrorTitle('PDF');
      setPlayerError(
        'PDF URL available nahi hai.'
      );

      return;
    }

    setPlayer({
      type: 'pdf',
      url,
      title: getTitle(item),
    });
  }

  /* =========================================================
     TEST
  ========================================================= */

  function openTest(item) {
    const questions =
      getTestQuestions(item);

    setTest({
      id: extractTestId(item),
      title: getTitle(item),
      questions: Array.isArray(
        questions
      )
        ? questions
        : [],
    });

    setTestAnswers({});
    setTestResult(null);
  }

  function submitTest() {
    if (!test) return;

    let correct = 0;

    test.questions.forEach(
      (question, index) => {
        const answer =
          question?.correct_answer ??
          question?.correct ??
          question?.answer;

        if (
          answer != null &&
          String(
            testAnswers[index]
          ) === String(answer)
        ) {
          correct++;
        }
      }
    );

    setTestResult({
      correct,
      total: test.questions.length,
    });
  }

  /* =========================================================
     CONTENT ITEM CLICK
  ========================================================= */

  function handleContentItem(item) {
    if (isFolder(item)) {
      openFolder(item);
      return;
    }

    if (isTest(item)) {
      openTest(item);
      return;
    }

    if (isPdf(item)) {
      openPdf(item);
      return;
    }

    if (isVideo(item)) {
      openVideo(item);
      return;
    }

    const url = getContentUrl(item);

    if (url) {
      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  /* =========================================================
     ENROLL
  ========================================================= */

  function enrollBatch(batch) {
    const id = getId(batch);

    if (!id) return;

    setEnrolled((previous) => {
      if (
        previous.some(
          (item) =>
            getId(item) === id
        )
      ) {
        return previous;
      }

      return [...previous, batch];
    });

    setEnrollPopup(true);
  }

  function isEnrolled(batch) {
    const id = getId(batch);

    return enrolled.some(
      (item) =>
        getId(item) === id
    );
  }

  /* =========================================================
     MENU
  ========================================================= */

  function navigateFromMenu(target) {
    setMenuOpen(false);

    if (target === 'batches') {
      setPage('batches');
      return;
    }

    if (target === 'my-batches') {
      setPage('my-batches');
      return;
    }

    if (target === 'community') {
      setPage('community');
      return;
    }

    if (target === 'ai') {
      setPage('ai');
      return;
    }

    if (target === 'contact') {
      window.open(
        OWNER_CONTACT,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    if (target === 'telegram') {
      setTelegramPopup(true);
      return;
    }

    if (target === 'admin') {
      window.location.href = '/admin';
    }
  }

  /* =========================================================
     HOME / BATCHES PAGE
  ========================================================= */

  function BatchesPage() {
    return (
      <div className="pm-page">
        <div className="pm-header">
          <div className="pm-brand">
            <img
              src="/prep-master-logo.png"
              alt="Prep Master"
              className="pm-logo"
            />

            <span>Prep Master</span>
          </div>

          <button
            type="button"
            className="pm-menu-button"
            onClick={() =>
              setMenuOpen((value) => !value)
            }
            aria-label="Open menu"
          >
            ⋮
          </button>
        </div>

        <div className="pm-search-wrap">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search batches..."
            className="pm-search"
          />
        </div>

        {loading ? (
          <div className="pm-state">
            Loading batches...
          </div>
        ) : error ? (
          <div className="pm-state pm-error">
            {error}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="pm-state">
            No batches found.
          </div>
        ) : (
          <div className="pm-batch-grid">
            {filteredBatches.map((batch) =>
              BatchCard({ batch })
            )}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     BATCH CARD
  ========================================================= */

  function BatchCard({ batch }) {
    const enrolledAlready =
      isEnrolled(batch);

    const price = formatPrice(getPrice(batch));
    const mrpValue = batch?.mrp ?? batch?.data?.mrp;
    const mrp =
      mrpValue != null &&
      Number(mrpValue) > Number(getPrice(batch) || 0)
        ? formatPrice(mrpValue)
        : '';
    const isNew = isFlagOn(batch?.is_new);
    const isTrending = isFlagOn(batch?.is_trending);

    return (
      <div className="pm-batch-card" key={getId(batch)}>
        {getBatchImage(batch) ? (
          <img
            src={getBatchImage(batch)}
            alt={getTitle(batch)}
            className="pm-batch-image"
          />
        ) : (
          <div className="pm-batch-image pm-image-placeholder">
            📚
          </div>
        )}

        <div className="pm-batch-body">
          {(isNew || isTrending) && (
            <div className="pm-badge-row">
              {isNew && (
                <span className="pm-badge pm-badge-new">New</span>
              )}
              {isTrending && (
                <span className="pm-badge pm-badge-trending">Trending</span>
              )}
            </div>
          )}

          <h3>
            {getTitle(batch)}
          </h3>

          {getDescription(batch) && (
            <p>
              {getDescription(
                batch
              )}
            </p>
          )}

          {price && (
            <div className="pm-price">
              {price}
              {mrp && <span className="pm-mrp">{mrp}</span>}
            </div>
          )}

          <div className="pm-card-actions">
            <button
              type="button"
              className="pm-secondary"
              onClick={() =>
                openBatch(batch)
              }
            >
              Study
            </button>

            <button
              type="button"
              className="pm-primary"
              onClick={() =>
                enrolledAlready
                  ? openBatch(batch)
                  : enrollBatch(batch)
              }
            >
              {enrolledAlready
                ? 'Enrolled'
                : 'Enroll'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     OVERVIEW PAGE
  ========================================================= */

  function OverviewTab() {
    if (overviewLoading) {
      return (
        <div className="pm-state">
          Loading overview...
        </div>
      );
    }

    if (overviewError) {
      return (
        <div className="pm-state pm-error">
          Overview load nahi ho saka.
          <small>{overviewError}</small>
        </div>
      );
    }

    const course =
      overviewData?.course;

    if (!course) {
      return (
        <div className="pm-state">
          Overview available nahi hai.
        </div>
      );
    }

    const offer = formatPrice(course.offer_price);
    const mrp =
      Number(course.mrp) > Number(course.offer_price || 0)
        ? formatPrice(course.mrp)
        : '';
    const discount = Number(course.discount_percentage) || 0;
    const rating = Number(course.average_rating) || 0;

    return (
      <div className="pm-overview">
        {course.thumbnail && (
          <img
            src={course.thumbnail}
            alt={course.title || 'Batch'}
            className="pm-overview-banner"
          />
        )}

        <div className="pm-overview-card">
          <h2 className="pm-overview-title">
            {course.title}
          </h2>

          <div className="pm-overview-price-row">
            {offer && <strong>{offer}</strong>}

            {mrp && (
              <span className="pm-mrp">{mrp}</span>
            )}

            {discount > 0 && (
              <span className="pm-discount">
                {discount}% OFF
              </span>
            )}
          </div>

          {(isFlagOn(course.is_new) ||
            isFlagOn(course.is_trending)) && (
            <div className="pm-overview-badges">
              {isFlagOn(course.is_new) && (
                <span className="pm-badge pm-badge-new">New</span>
              )}

              {isFlagOn(course.is_trending) && (
                <span className="pm-badge pm-badge-trending">Trending</span>
              )}
            </div>
          )}
        </div>

        <div className="pm-overview-card">
          <h3 className="pm-overview-title">
            Details
          </h3>

          <div
            className="pm-overview-description"
            dangerouslySetInnerHTML={{
              __html:
                sanitizeHtml(course.description) ||
                '<p>No description available.</p>',
            }}
          />
        </div>

        {(course.start_date ||
          course.end_date) && (
          <div className="pm-overview-card">
            <h3 className="pm-overview-title">
              Batch Details
            </h3>

            {course.start_date && (
              <p>
                <strong>
                  Start Date:
                </strong>{' '}
                {formatDate(
                  course.start_date
                )}
              </p>
            )}

            {course.end_date && (
              <p>
                <strong>
                  End Date:
                </strong>{' '}
                {formatDate(
                  course.end_date
                )}
              </p>
            )}

            {rating > 0 && (
              <p>
                <strong>
                  Rating:
                </strong>{' '}
                ⭐{' '}
                {rating}
              </p>
            )}

            {course.review_count != null && (
              <p>
                <strong>
                  Reviews:
                </strong>{' '}
                {course.review_count}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     CONTENT TAB
  ========================================================= */

  function ContentTab() {
    return (
      <div>
        {folderStack.length > 0 && (
          <div className="pm-folder-bar">
            <button
              type="button"
              className="pm-back-button"
              onClick={goBackFolder}
              aria-label="Back to previous folder"
            >
              ←
            </button>

            <nav className="pm-breadcrumb" aria-label="Folder path">
              <button
                type="button"
                onClick={() => goToFolderDepth(0)}
              >
                Content
              </button>

              {folderStack.map((folder, index) => (
                <span key={`${folder.id}-${index}`}>
                  <span aria-hidden="true" className="pm-breadcrumb-sep">
                    ›
                  </span>
                  {index === folderStack.length - 1 ? (
                    <span aria-current="page">{folder.title}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goToFolderDepth(index + 1)}
                    >
                      {folder.title}
                    </button>
                  )}
                </span>
              ))}
            </nav>
          </div>
        )}

        {contentLoading ? (
          <div className="pm-state">
            Loading content...
          </div>
        ) : contentError ? (
          <div className="pm-state pm-error">
            {contentError}
          </div>
        ) : contentItems.length === 0 ? (
          <div className="pm-state">
            No content found.
          </div>
        ) : (
          <div className="pm-content-list">
            {contentItems.map((item, index) =>
              ContentCard({
                item,
                key: `${getContentId(item) || 'item'}-${index}`,
              })
            )}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     CONTENT CARD
  ========================================================= */

  function ContentCard({ item, key }) {
    const folder =
      isFolder(item);

    const locked = !folder && isLocked(item);

    let icon = '📄';
    let kind = 'File';

    if (folder) {
      icon = '📁';
      kind = 'Folder';
    } else if (isVideo(item)) {
      icon = '🎥';
      kind = 'Video';
    } else if (isPdf(item)) {
      icon = '📄';
      kind = 'PDF';
    } else if (isTest(item)) {
      icon = '📝';
      kind = 'Test';
    }

    const counts =
      item?.data?.content_counts ??
      item?.content_counts ??
      null;

    const videoCount = sumCount(counts?.video);
    const pdfCount = sumCount(counts?.pdf);

    const meta = [];

    if (folder) {
      if (videoCount) {
        meta.push(`${videoCount} video${videoCount === 1 ? '' : 's'}`);
      }
      if (pdfCount) {
        meta.push(`${pdfCount} PDF${pdfCount === 1 ? '' : 's'}`);
      }
    } else {
      meta.push(kind);
    }

    return (
      <button
        key={key}
        type="button"
        className={`pm-content-card${locked ? ' pm-content-locked' : ''}`}
        onClick={() =>
          handleContentItem(item)
        }
      >
        <div className="pm-content-icon" aria-hidden="true">
          {icon}
        </div>

        <div className="pm-content-info">
          <div className="pm-content-title">
            {getTitle(item)}
          </div>

          {meta.length > 0 && (
            <div className="pm-content-meta">
              {meta.join(' • ')}
            </div>
          )}
        </div>

        <div className="pm-content-arrow" aria-hidden="true">
          {locked ? '🔒' : '›'}
        </div>
        {locked && <span className="sr-only">Locked</span>}
      </button>
    );
  }

  /* =========================================================
     LIVE CLASSES TAB
  ========================================================= */

  function LiveClassesTab() {
    if (liveLoading) {
      return (
        <div className="pm-state">
          Loading live classes...
        </div>
      );
    }

    if (liveError) {
      return (
        <div className="pm-state pm-error">
          {liveError}
        </div>
      );
    }

    if (liveClasses.length === 0) {
      return (
        <div className="pm-state">
          Abhi koi live class available nahi hai.
        </div>
      );
    }

    return (
      <div className="pm-live-list">
        {liveClasses.map(
          (item, index) => {
            const title =
              getLiveTitle(item);

            const teacher =
              getLiveTeacher(item);

            const date =
              getLiveDate(item);

            const url =
              getLiveUrl(item);

            const thumbnail =
              getLiveThumbnail(item);

            return (
              <div
                className="pm-live-card"
                key={
                  getId(item) ||
                  index
                }
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={title}
                    className="pm-live-thumbnail"
                  />
                ) : (
                  <div className="pm-live-icon">
                    🔴
                  </div>
                )}

                <div className="pm-live-info">
                  <div className="pm-live-title">
                    {title}
                  </div>

                  {teacher && (
                    <div className="pm-live-meta">
                      👨‍🏫 {teacher}
                    </div>
                  )}

                  {date && (
                    <div className="pm-live-meta">
                      🕐 {formatDateTime(date)}
                    </div>
                  )}

                  {getLiveStatus(item) && (
                    <span className="pm-badge pm-live-status">
                      {getLiveStatus(item)}
                    </span>
                  )}
                </div>

                {url && (
                  <button
                    type="button"
                    className="pm-live-button"
                    onClick={() =>
                      window.open(
                        url,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    Join
                  </button>
                )}
              </div>
            );
          }
        )}
      </div>
    );
  }

  /* =========================================================
     BATCH PAGE
  ========================================================= */

  function BatchPage() {
    if (!selectedBatch) {
      return null;
    }

    const image =
      getBatchImage(
        selectedBatch
      );

    return (
      <div className="pm-page">
        <div className="pm-header">
          <button
            type="button"
            className="pm-back-button"
            onClick={() =>
              setPage(returnPage || 'batches')
            }
            aria-label="Back"
          >
            ←
          </button>

          <div className="pm-header-title">
            {getTitle(
              selectedBatch
            )}
          </div>
        </div>

        <div className="pm-batch-header">
          {image ? (
            <img
              src={image}
              alt={getTitle(
                selectedBatch
              )}
              className="pm-batch-header-image"
            />
          ) : (
            <div className="pm-batch-header-placeholder">
              📚
            </div>
          )}

          <div className="pm-batch-header-info">
            <h1>
              {getTitle(
                selectedBatch
              )}
            </h1>

            <div className="pm-price">
              ₹{getPrice(
                selectedBatch
              )}
            </div>
          </div>
        </div>

        <div className="pm-course-tabs">
          <button
            type="button"
            className={`pm-course-tab ${
              activeBatchTab ===
              'overview'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              changeBatchTab(
                'overview'
              )
            }
          >
            Overview
          </button>

          <button
            type="button"
            className={`pm-course-tab ${
              activeBatchTab ===
              'content'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              changeBatchTab(
                'content'
              )
            }
          >
            Content
          </button>

          <button
            type="button"
            className={`pm-course-tab ${
              activeBatchTab ===
              'live'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              changeBatchTab(
                'live'
              )
            }
          >
            Live Classes
          </button>
        </div>

        {activeBatchTab === 'overview' &&
          OverviewTab()}

        {activeBatchTab === 'content' &&
          ContentTab()}

        {activeBatchTab === 'live' &&
          LiveClassesTab()}
      </div>
    );
  }

  /* =========================================================
     MY BATCHES
  ========================================================= */

  function MyBatchesPage() {
    return (
      <div className="pm-page">
        <div className="pm-section-title">
          My Batches
        </div>

        {enrolled.length === 0 ? (
          <div className="pm-state">
            Abhi koi batch enrolled nahi hai.
          </div>
        ) : (
          <div className="pm-batch-grid">
            {enrolled.map((batch) =>
              BatchCard({ batch })
            )}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     COMMUNITY
  ========================================================= */

  function CommunityPage() {
    return (
      <div className="pm-page">
        <div className="pm-section-title">
          💬 Community
        </div>

        <div className="pm-coming-soon">
          <div>💬</div>

          <h2>
            Coming Soon
          </h2>

          <p>
            Community feature jaldi
            available hoga.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     AI DOUBTS
  ========================================================= */

  function AiPage() {
    return (
      <div className="pm-page">
        <div className="pm-section-title">
          🤖 AI Doubts Support
        </div>

        <div className="pm-coming-soon">
          <div>🤖</div>

          <h2>
            Coming Soon
          </h2>

          <p>
            AI Doubts Support jaldi
            available hoga.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     PLAYER
  ========================================================= */

  function VideoOverlay() {
    if (!player) return null;

    return (
      <div className="pm-overlay">
        <div className="pm-player-box">
          <div className="pm-player-header">
            <button
              type="button"
              onClick={() =>
                setPlayer(null)
              }
            >
              ←
            </button>

            <div>
              {player.title}
            </div>
          </div>

          {player.type ===
            'youtube' && (
            <iframe
              src={player.url}
              title={player.title}
              className="pm-video-frame"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          )}

          {player.type ===
            'video' && (
            <div className="pm-video-wrapper">
              <HlsVideo
                key={player.url}
                src={player.url}
                title={player.title}
                className="pm-video"
                onFatalError={(message) => {
                  setPlayer(null);
                  setPlayerErrorTitle('Playback Error');
                  setPlayerError(message);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     PDF OVERLAY
  ========================================================= */

  function PdfOverlay() {
    if (
      !player ||
      player.type !== 'pdf'
    ) {
      return null;
    }

    return (
      <div className="pm-overlay">
        <div className="pm-player-box">
          <PdfPlayer
            url={player.url}
            title={player.title}
            onClose={() =>
              setPlayer(null)
            }
          />
        </div>
      </div>
    );
  }

  /* =========================================================
     TEST OVERLAY
  ========================================================= */

  function TestOverlay() {
    if (!test) return null;

    return (
      <div className="pm-overlay">
        <div className="pm-test-box">
          <div className="pm-player-header">
            <button
              type="button"
              onClick={() =>
                setTest(null)
              }
            >
              ←
            </button>

            <div>
              {test.title}
            </div>
          </div>

          {test.questions.length ===
          0 ? (
            <div className="pm-state">
              No questions available.
            </div>
          ) : (
            <div className="pm-test-content">
              {test.questions.map(
                (
                  question,
                  index
                ) => {
                  const options =
                    getOptions(
                      question
                    );

                  return (
                    <div
                      className="pm-test-question"
                      key={index}
                    >
                      <h3>
                        {index + 1}.{' '}
                        {getQuestionText(
                          question
                        )}
                      </h3>

                      {Array.isArray(
                        options
                      ) &&
                        options.map(
                          (
                            option,
                            optionIndex
                          ) => {
                            const value =
                              typeof option ===
                              'object'
                                ? option?.id ??
                                  option?.value ??
                                  option?.text ??
                                  option?.title ??
                                  optionIndex
                                : option;

                            const label =
                              typeof option ===
                              'object'
                                ? option?.text ??
                                  option?.title ??
                                  option?.label ??
                                  value
                                : option;

                            return (
                              <label
                                className="pm-option"
                                key={
                                  optionIndex
                                }
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={value}
                                  checked={
                                    String(
                                      testAnswers[
                                        index
                                      ] ?? ''
                                    ) ===
                                    String(
                                      value
                                    )
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setTestAnswers(
                                      (
                                        previous
                                      ) => ({
                                        ...previous,
                                        [index]:
                                          event
                                            .target
                                            .value,
                                      })
                                    )
                                  }
                                />

                                <span>
                                  {label}
                                </span>
                              </label>
                            );
                          }
                        )}
                    </div>
                  );
                }
              )}

              <button
                type="button"
                className="pm-primary"
                onClick={
                  submitTest
                }
              >
                Submit Test
              </button>

              {testResult && (
                <div className="pm-test-result">
                  Score:{' '}
                  {testResult.correct}/
                  {testResult.total}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     ENROLL POPUP
  ========================================================= */

  function EnrollPopup() {
    if (!enrollPopup) {
      return null;
    }

    return (
      <div className="pm-popup-overlay">
        <div className="pm-popup-card">
          <div className="pm-popup-icon">
            🎉
          </div>

          <h2>
            Congratulations 🎉
          </h2>

          <p>
            Batch successfully enrolled.
            Ab ye batch My Batches me
            available hai.
          </p>

          <button
            type="button"
            className="pm-primary"
            onClick={() =>
              setEnrollPopup(false)
            }
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     TELEGRAM POPUP
  ========================================================= */

  function TelegramPopup() {
    if (!telegramPopup) {
      return null;
    }

    return (
      <div className="pm-popup-overlay">
        <div className="pm-popup-card">
          <img
            src="/prep-master-icon.png"
            alt="Prep Master"
            className="pm-popup-logo"
          />

          <h2>
            Join Prep Master
          </h2>

          <p>
            Latest updates aur
            announcements ke liye Telegram
            channel join karein.
          </p>

          <button
            type="button"
            className="pm-primary"
            onClick={() => {
              setTelegramPopup(false);

              window.open(
                TELEGRAM_URL,
                '_blank',
                'noopener,noreferrer'
              );
            }}
          >
            ✈️ Join Telegram
          </button>

          <button
            type="button"
            className="pm-popup-close"
            onClick={() =>
              setTelegramPopup(false)
            }
          >
            Maybe Later
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MENU
  ========================================================= */

  function SideMenu() {
    if (!menuOpen) {
      return null;
    }

    return (
      <div className="pm-menu-panel">
        <button
          type="button"
          onClick={() =>
            navigateFromMenu(
              'batches'
            )
          }
        >
          📚 Batches
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu(
              'my-batches'
            )
          }
        >
          📖 My Batches
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu(
              'community'
            )
          }
        >
          💬 Community
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu(
              'ai'
            )
          }
        >
          🤖 AI Doubts Support
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu(
              'telegram'
            )
          }
        >
          ✈️ Join Telegram
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu(
              'contact'
            )
          }
        >
          👤 Contact Owner
        </button>
      </div>
    );
  }

  /* =========================================================
     BOTTOM NAV
  ========================================================= */

  function BottomNav() {
    if (page === 'batch') {
      return null;
    }

    return (
      <div className="pm-bottom-nav">
        <button
          type="button"
          className={
            page === 'community'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('community')
          }
        >
          <span>💬</span>
          Community
        </button>

        <button
          type="button"
          className={
            page === 'my-batches'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('my-batches')
          }
        >
          <span>📖</span>
          My Batches
        </button>

        <button
          type="button"
          className={
            page === 'batches'
              ? 'active pm-main-nav'
              : 'pm-main-nav'
          }
          onClick={() =>
            setPage('batches')
          }
        >
          <span>📚</span>
          Batches
        </button>

        <button
          type="button"
          className={
            page === 'ai'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('ai')
          }
        >
          <span>🤖</span>
          AI Doubts
        </button>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="pm-app">
      {page === 'batches' && BatchesPage()}

      {page === 'my-batches' && MyBatchesPage()}

      {page === 'community' && CommunityPage()}

      {page === 'ai' && AiPage()}

      {page === 'batch' && BatchPage()}

      {SideMenu()}

      {BottomNav()}

      {player?.type === 'video' && VideoOverlay()}

      {player?.type === 'pdf' && PdfOverlay()}

      {test && TestOverlay()}

      {playerError && (
        <div className="pm-popup-overlay">
          <div className="pm-popup-card">
            <div className="pm-popup-icon">
              ⚠️
            </div>

            <h2>
              {playerErrorTitle}
            </h2>

            <p>
              {playerError}
            </p>

            <button
              type="button"
              className="pm-primary"
              onClick={() =>
                setPlayerError('')
              }
            >
              Close
            </button>
          </div>
        </div>
      )}

      {playerLoading && (
        <div className="pm-popup-overlay">
          <div className="pm-popup-card">
            <div className="pm-popup-icon">
              ⏳
            </div>

            <h2>
              Loading Video...
            </h2>

            <p>
              Please wait.
            </p>
          </div>
        </div>
      )}

      <EnrollPopup />

      <TelegramPopup />
    </div>
  );
}
