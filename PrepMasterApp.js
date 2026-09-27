'use client';

import { useEffect, useMemo, useState } from 'react';
import PdfPlayer from './PdfPlayer';

/* =========================================================
   HELPERS
========================================================= */

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
    'FREE'
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

function extractOverviewDetails(json) {
  const sections = Array.isArray(json?.data)
    ? json.data
    : [];

  const overview = sections.find(
    (item) => item?.type === 'overview'
  );

  const layouts = Array.isArray(overview?.data)
    ? overview.data
    : [];

  const detailsLayout = layouts.find(
    (item) => item?.layout_type === 'details'
  );

  const details = Array.isArray(
    detailsLayout?.layout_data
  )
    ? detailsLayout.layout_data
    : [];

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

    try {
      setContentLoading(true);
      setContentError('');

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
      setContentItems([]);

      setContentError(
        err?.message ||
          'Unable to load content.'
      );
    } finally {
      setContentLoading(false);
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

  async function openFolder(item) {
    if (!selectedBatch) return;

    const folderId = getId(item);

    if (!folderId) return;

    setFolderStack((previous) => [
      ...previous,
      {
        id: currentFolder,
        title:
          currentFolder === '0'
            ? 'Content'
            : 'Folder',
      },
    ]);

    setCurrentFolder(folderId);

    await loadContent(
      getId(selectedBatch),
      folderId
    );
  }

  async function goBackFolder() {
    if (!selectedBatch) return;

    const previous =
      folderStack[
        folderStack.length - 1
      ];

    if (!previous) {
      setCurrentFolder('0');

      await loadContent(
        getId(selectedBatch),
        '0'
      );

      return;
    }

    setFolderStack((stack) =>
      stack.slice(0, -1)
    );

    setCurrentFolder(previous.id);

    await loadContent(
      getId(selectedBatch),
      previous.id
    );
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

    /* Direct normal video */

    if (
      directUrl &&
      !isHlsOrDashUrl(directUrl)
    ) {
      setPlayer({
        type: 'video',
        url: directUrl,
        title,
      });

      return;
    }

    /* Authorized backend playback */

    const contentId = getId(item);

    const courseId =
      item?.course_id ??
      selectedBatch
        ? getId(selectedBatch)
        : '';

    if (!contentId || !courseId) {
      setPlayerError(
        'Playback information is not available.'
      );

      return;
    }

    try {
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

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error ||
            'Unable to load video.'
        );
      }

      const playableUrl =
        json?.url ??
        json?.data?.url ??
        json?.data?.file_url ??
        null;

      if (!playableUrl) {
        throw new Error(
          'Playable video URL was not returned.'
        );
      }

      setPlayer({
        type: 'video',
        url: playableUrl,
        title,
        hls: isHlsOrDashUrl(
          playableUrl
        ),
      });
    } catch (err) {
      setPlayerError(
        err?.message ||
          'Unable to load video.'
      );
    } finally {
      setPlayerLoading(false);
    }
  }

  /* =========================================================
     PDF
  ========================================================= */

  function openPdf(item) {
    const url = getPdfUrl(item);

    if (!url) {
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
      window.location.href =
        'mailto:prepmastersubhan@gmail.com';
    }

    if (target === 'telegram') {
      window.open(
        'https://t.me/',
        '_blank',
        'noopener,noreferrer'
      );
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
            {filteredBatches.map(
              (batch) => (
                <BatchCard
                  key={getId(batch)}
                  batch={batch}
                />
              )
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

    return (
      <div className="pm-batch-card">
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

          <div className="pm-price">
            ₹{getPrice(batch)}
          </div>

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
          {overviewError}
        </div>
      );
    }

    const course =
      overviewData?.course;

    if (!course) {
      return (
        <div className="pm-state">
          Overview details available nahi hain.
        </div>
      );
    }

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
            {course.offer_price && (
              <strong>
                ₹{course.offer_price}
              </strong>
            )}

            {course.mrp && (
              <span className="pm-mrp">
                ₹{course.mrp}
              </span>
            )}

            {course.discount_percentage && (
              <span className="pm-discount">
                {course.discount_percentage}%
                OFF
              </span>
            )}
          </div>

          <div className="pm-overview-badges">
            {course.is_new && (
              <span className="pm-badge">
                {course.is_new}
              </span>
            )}

            {course.is_trending && (
              <span className="pm-badge">
                {course.is_trending}
              </span>
            )}
          </div>
        </div>

        <div className="pm-overview-card">
          <h3 className="pm-overview-title">
            Details
          </h3>

          <div
            className="pm-overview-description"
            dangerouslySetInnerHTML={{
              __html:
                course.description ||
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

            {course.average_rating && (
              <p>
                <strong>
                  Rating:
                </strong>{' '}
                ⭐{' '}
                {course.average_rating}
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
        {currentFolder !== '0' && (
          <button
            type="button"
            className="pm-back-button"
            onClick={goBackFolder}
          >
            ← Back
          </button>
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
            {contentItems.map(
              (item, index) => (
                <ContentCard
                  key={
                    getId(item) ||
                    index
                  }
                  item={item}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     CONTENT CARD
  ========================================================= */

  function ContentCard({ item }) {
    const folder =
      isFolder(item);

    let icon = '📄';

    if (folder) {
      icon = '📁';
    } else if (isVideo(item)) {
      icon = '🎥';
    } else if (isPdf(item)) {
      icon = '📕';
    } else if (isTest(item)) {
      icon = '📝';
    }

    return (
      <button
        type="button"
        className="pm-content-card"
        onClick={() =>
          handleContentItem(item)
        }
      >
        <div className="pm-content-icon">
          {icon}
        </div>

        <div className="pm-content-info">
          <div className="pm-content-title">
            {getTitle(item)}
          </div>

          {folder &&
            item?.data
              ?.content_counts && (
              <div className="pm-content-meta">
                {item.data.content_counts
                  .video?.paid ||
                  0}{' '}
                videos
              </div>
            )}
        </div>

        <div className="pm-content-arrow">
          →
        </div>
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
          No live classes available.
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
                      🕐 {formatDate(date)}
                    </div>
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
              setPage('batches')
            }
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

        {activeBatchTab ===
          'overview' && (
          <OverviewTab />
        )}

        {activeBatchTab ===
          'content' && (
          <ContentTab />
        )}

        {activeBatchTab ===
          'live' && (
          <LiveClassesTab />
        )}
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
            {enrolled.map(
              (batch) => (
                <BatchCard
                  key={getId(batch)}
                  batch={batch}
                />
              )
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
              <video
                src={player.url}
                controls
                autoPlay
                playsInline
                className="pm-video"
              />

              {player.hls && (
                <div className="pm-player-note">
                  HLS stream browser support
                  par depend karta hai.
                </div>
              )}
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
                'https://t.me/',
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
      {page === 'batches' && (
        <BatchesPage />
      )}

      {page === 'my-batches' && (
        <MyBatchesPage />
      )}

      {page === 'community' && (
        <CommunityPage />
      )}

      {page === 'ai' && <AiPage />}

      {page === 'batch' && (
        <BatchPage />
      )}

      <SideMenu />

      <BottomNav />

      {player?.type ===
        'video' && (
        <VideoOverlay />
      )}

      {player?.type ===
        'pdf' && (
        <PdfOverlay />
      )}

      {test && <TestOverlay />}

      {playerError && (
        <div className="pm-popup-overlay">
          <div className="pm-popup-card">
            <div className="pm-popup-icon">
              ⚠️
            </div>

            <h2>
              Playback Error
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
