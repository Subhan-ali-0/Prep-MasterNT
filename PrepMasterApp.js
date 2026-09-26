'use client';

import { useEffect, useMemo, useState } from 'react';
import PdfPlayer from './PdfPlayer';
import ShakaPlayer from './ShakaPlayer';

function getId(item) {
  return String(
    item?.entity_id ??
      item?.id ??
      item?.data?.id ??
      item?.course_id ??
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
  const price =
    item?.offer_price ??
    item?.price ??
    item?.data?.offer_price ??
    item?.data?.price ??
    '';

  if (price === '' || price === null || price === undefined) {
    return 'FREE';
  }

  return String(price);
}

function getBatchImage(batch) {
  return (
    batch?.thumbnail ||
    batch?.image ||
    batch?.banner ||
    ''
  );
}

function isFolder(item) {
  return (
    item?.type === 'folder' ||
    item?.data?.content_counts?.folders?.total > 0 ||
    Boolean(item?.data?.folders)
  );
}

function getFileType(item) {
  return Number(
    item?.file_type ??
      item?.content_type ??
      item?.data?.file_type ??
      item?.data?.content_type ??
      0
  );
}

function getVideoType(item) {
  return Number(
    item?.video_type ??
      item?.data?.video_type ??
      0
  );
}

function getContentUrl(item) {
  return (
    item?.file_url ||
    item?.data?.file_url ||
    item?.url ||
    item?.data?.url ||
    item?.stream_url ||
    item?.data?.stream_url ||
    item?.video_url ||
    item?.data?.video_url ||
    ''
  );
}

function isYouTubeUrl(url = '') {
  return (
    /youtube\.com\/embed\//i.test(String(url)) ||
    /youtube\.com\/watch/i.test(String(url)) ||
    /youtu\.be\//i.test(String(url))
  );
}

function isHlsOrDashUrl(url = '') {
  return (
    /\.m3u8(\?|$)/i.test(String(url)) ||
    /\.mpd(\?|$)/i.test(String(url))
  );
}

function isVideo(item) {
  const type = getFileType(item);
  const videoType = getVideoType(item);
  const url = String(getContentUrl(item));

  return (
    type === 2 ||
    videoType > 0 ||
    isHlsOrDashUrl(url) ||
    /\.(mp4|webm)(\?|$)/i.test(url) ||
    isYouTubeUrl(url)
  );
}

function isPdf(item) {
  if (!item) return false;

  const kind = String(
    item?.type ??
      item?.data?.type ??
      item?.content_type ??
      item?.data?.content_type ??
      ''
  ).toLowerCase();

  const title = String(
    item?.title ??
      item?.name ??
      item?.data?.title ??
      ''
  ).toLowerCase();

  const directPdfUrl = String(
    item?.pdf_url ??
      item?.data?.pdf_url ??
      item?.notes_url ??
      item?.data?.notes_url ??
      item?.note_url ??
      item?.data?.note_url ??
      item?.document_url ??
      item?.data?.document_url ??
      ''
  );

  const fileUrl = String(
    item?.file_url ??
      item?.data?.file_url ??
      item?.url ??
      item?.data?.url ??
      ''
  );

  const hasPdf =
    item?.has_pdf === 1 ||
    item?.has_pdf === '1' ||
    item?.data?.has_pdf === 1 ||
    item?.data?.has_pdf === '1';

  const explicitPdf =
    kind === 'pdf' ||
    kind === 'notes' ||
    kind === 'note' ||
    Boolean(item?.pdf_url) ||
    Boolean(item?.data?.pdf_url) ||
    Boolean(item?.notes_url) ||
    Boolean(item?.data?.notes_url) ||
    Boolean(item?.note_url) ||
    Boolean(item?.data?.note_url) ||
    Boolean(item?.document_url) ||
    Boolean(item?.data?.document_url) ||
    /\.pdf(\?|$)/i.test(directPdfUrl) ||
    /\.pdf(\?|$)/i.test(fileUrl);

  if (explicitPdf || hasPdf) {
    return true;
  }

  const looksLikeVideo =
    getFileType(item) === 2 ||
    getVideoType(item) > 0 ||
    isHlsOrDashUrl(fileUrl) ||
    /\.(mp4|webm)(\?|$)/i.test(fileUrl) ||
    isYouTubeUrl(fileUrl);

  return (
    !looksLikeVideo &&
    (title.includes('notes') ||
      title.includes('note'))
  );
}

function getPdfUrl(item) {
  const directPdf =
    item?.pdf_url ||
    item?.data?.pdf_url ||
    item?.notes_url ||
    item?.data?.notes_url ||
    item?.note_url ||
    item?.data?.note_url ||
    item?.document_url ||
    item?.data?.document_url;

  if (directPdf) {
    return String(directPdf);
  }

  const fileUrl =
    item?.file_url ||
    item?.data?.file_url ||
    item?.url ||
    item?.data?.url ||
    '';

  if (
    /\.pdf(\?|$)/i.test(String(fileUrl)) ||
    item?.has_pdf === 1 ||
    item?.has_pdf === '1' ||
    item?.data?.has_pdf === 1 ||
    item?.data?.has_pdf === '1'
  ) {
    return String(fileUrl);
  }

  return '';
}

function isTest(item) {
  const title = getTitle(item).toLowerCase();

  return (
    item?.type === 'test' ||
    item?.data?.type === 'test' ||
    title.includes('test') ||
    title.includes('quiz') ||
    title.includes('mock test') ||
    title.includes('sample paper')
  );
}

function extractTestId(item) {
  return (
    item?.test_id ??
    item?.testId ??
    item?.data?.test_id ??
    item?.data?.testId ??
    item?.entity_id ??
    item?.id ??
    item?.data?.id ??
    ''
  );
}

function getTestQuestions(data) {
  const candidates = [
    data?.questions,
    data?.data?.questions,
    data?.data?.data?.questions,
    data?.test?.questions,
    data?.data?.test?.questions,
    data?.items,
    data?.data?.items,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getQuestionText(question) {
  return (
    question?.question ??
    question?.question_text ??
    question?.title ??
    question?.text ??
    question?.data?.question ??
    question?.data?.question_text ??
    ''
  );
}

function getOptions(question) {
  const options =
    question?.options ??
    question?.answers ??
    question?.choices ??
    question?.data?.options ??
    [];

  if (Array.isArray(options)) {
    return options.map((option, index) => {
      if (typeof option === 'string') {
        return {
          key: String.fromCharCode(65 + index),
          text: option,
        };
      }

      return {
        key:
          option?.key ??
          option?.label ??
          String.fromCharCode(65 + index),
        text:
          option?.text ??
          option?.value ??
          option?.option ??
          option?.title ??
          '',
      };
    });
  }

  if (options && typeof options === 'object') {
    return Object.entries(options).map(([key, value]) => ({
      key,
      text:
        typeof value === 'string'
          ? value
          : value?.text ??
            value?.value ??
            value?.title ??
            '',
    }));
  }

  return [];
}

export default function PrepMasterApp() {
  const [page, setPage] = useState('home');

  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchError, setBatchError] = useState('');

  const [search, setSearch] = useState('');

  const [enrolled, setEnrolled] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [contentItems, setContentItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');

  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);

  const [player, setPlayer] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [enrollPopup, setEnrollPopup] = useState(null);

  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');
  const [activeTest, setActiveTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('pm_enrolled') || '[]'
      );

      if (Array.isArray(saved)) {
        setEnrolled(saved);
      }
    } catch {
      setEnrolled([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'pm_enrolled',
        JSON.stringify(enrolled)
      );
    } catch {}
  }, [enrolled]);

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    setLoadingBatches(true);
    setBatchError('');

    try {
      const response = await fetch('/api/batches', {
        cache: 'no-store',
      });

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error || 'Unable to load batches.'
        );
      }

      setBatches(
        Array.isArray(json?.batches)
          ? json.batches
          : []
      );
    } catch (error) {
      setBatchError(
        error?.message || 'Unable to load batches.'
      );
    } finally {
      setLoadingBatches(false);
    }
  }

  function isEnrolled(batch) {
    const id = getId(batch);

    return enrolled.some(
      (item) => String(getId(item)) === String(id)
    );
  }

  function enrollBatch(batch) {
    if (!batch) return;

    if (!isEnrolled(batch)) {
      setEnrolled((prev) => [...prev, batch]);
    }

    setEnrollPopup(batch);
  }

  function openBatch(batch) {
    setSelectedBatch(batch);
    setCurrentFolder(null);
    setFolderStack([]);
    setContentItems([]);
    setContentError('');
    setPlayer(null);
    setPlayerError('');
    setPage('batch');

    loadContent(getId(batch), '0');
  }

  async function loadContent(courseId, folderId = '0') {
    if (!courseId) return;

    setContentLoading(true);
    setContentError('');

    try {
      const response = await fetch(
        `/api/content?content=${encodeURIComponent(
          courseId
        )}&folder=${encodeURIComponent(folderId)}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error || 'Unable to load content.'
        );
      }

      setContentItems(
        Array.isArray(json?.data)
          ? json.data
          : []
      );
    } catch (error) {
      setContentItems([]);

      setContentError(
        error?.message ||
          'Unable to load course content.'
      );
    } finally {
      setContentLoading(false);
    }
  }

  function openFolder(folder) {
    if (!selectedBatch) return;

    const folderId = getId(folder);

    setFolderStack((prev) => [
      ...prev,
      {
        id: folderId,
        title: getTitle(folder),
      },
    ]);

    setCurrentFolder(folder);

    loadContent(
      getId(selectedBatch),
      folderId
    );
  }

  function goBackFolder() {
    if (!selectedBatch) return;

    if (folderStack.length === 0) {
      setCurrentFolder(null);
      setContentItems([]);
      setPage('home');
      return;
    }

    const nextStack = [...folderStack];
    nextStack.pop();

    setFolderStack(nextStack);

    const parentId =
      nextStack.length > 0
        ? nextStack[nextStack.length - 1].id
        : '0';

    setCurrentFolder(
      nextStack.length > 0
        ? nextStack[nextStack.length - 1]
        : null
    );

    loadContent(
      getId(selectedBatch),
      parentId
    );
  }

  async function openVideo(item) {
    if (!selectedBatch) return;

    const directUrl = String(getContentUrl(item));

    setPlayerLoading(true);
    setPlayerError('');
    setPlayer(null);

    try {
      if (isYouTubeUrl(directUrl)) {
        setPlayer({
          type: 'youtube',
          title: getTitle(item),
          url: directUrl,
        });

        return;
      }

      if (isHlsOrDashUrl(directUrl)) {
        setPlayer({
          type: 'video',
          title: getTitle(item),
          url: directUrl,
        });

        return;
      }

      const contentId = getId(item);

      if (!contentId) {
        throw new Error('Video ID unavailable.');
      }

      const response = await fetch(
        `/api/playback?content_id=${encodeURIComponent(
          contentId
        )}&course_id=${encodeURIComponent(
          getId(selectedBatch)
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error ||
            'Unable to load video playback.'
        );
      }

      const playableUrl =
        json?.url ||
        json?.data?.url ||
        json?.decryptedData?.file_url ||
        json?.data?.decryptedData?.file_url ||
        '';

      if (!playableUrl) {
        throw new Error(
          'No playable video URL was returned.'
        );
      }

      if (isYouTubeUrl(playableUrl)) {
        setPlayer({
          type: 'youtube',
          title: getTitle(item),
          url: playableUrl,
        });
      } else {
        setPlayer({
          type: 'video',
          title: getTitle(item),
          url: playableUrl,
        });
      }
    } catch (error) {
      setPlayerError(
        error?.message ||
          'Unable to load video.'
      );
    } finally {
      setPlayerLoading(false);
    }
  }

  function openPdf(item) {
    const url = getPdfUrl(item);

    if (!url) {
      setPlayerError(
        'Is note ka actual PDF URL source API ne provide nahi kiya.'
      );
      return;
    }

    setPlayerError('');

    setPlayer({
      type: 'pdf',
      title: getTitle(item),
      url,
    });
  }

  async function openTest(item) {
    const testId = extractTestId(item);

    if (!testId) {
      alert('Test ID unavailable.');
      return;
    }

    setTestLoading(true);
    setTestError('');
    setTestResult(null);
    setTestQuestions([]);
    setTestAnswers({});

    setActiveTest({
      id: String(testId),
      title: getTitle(item),
      item,
    });

    try {
      const response = await fetch(
        `/api/test?test_instructions=${encodeURIComponent(
          testId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error ||
            `Test source returned HTTP ${response.status}`
        );
      }

      const questions =
        getTestQuestions(json?.data);

      setTestQuestions(questions);

      if (!questions.length) {
        setTestError(
          'Test instructions load ho gayi, lekin questions nahi mile.'
        );
      }
    } catch (error) {
      setTestError(
        error?.message ||
          'Unable to load test instructions.'
      );
    } finally {
      setTestLoading(false);
    }
  }

  async function startTest() {
    if (!activeTest?.id) return;

    setTestLoading(true);
    setTestError('');

    try {
      const response = await fetch(
        `/api/test?test_data=${encodeURIComponent(
          activeTest.id
        )}`,
        {
          cache: 'no-store',
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error ||
            `Test source returned HTTP ${response.status}`
        );
      }

      const questions =
        getTestQuestions(json?.data);

      setTestQuestions(questions);
      setTestAnswers({});
      setTestResult(null);

      if (!questions.length) {
        setTestError(
          'Test data load ho gaya, lekin questions nahi mile.'
        );
      }
    } catch (error) {
      setTestError(
        error?.message ||
          'Unable to load test data.'
      );
    } finally {
      setTestLoading(false);
    }
  }

  function submitLocalTest() {
    if (!testQuestions.length) return;

    let correct = 0;

    testQuestions.forEach((question, index) => {
      const selected = testAnswers[index];

      const answer =
        question?.correct_answer ??
        question?.correctAnswer ??
        question?.answer ??
        question?.data?.correct_answer ??
        question?.data?.correctAnswer;

      if (
        selected != null &&
        answer != null &&
        String(selected).toLowerCase() ===
          String(answer).toLowerCase()
      ) {
        correct += 1;
      }
    });

    setTestResult({
      correct,
      total: testQuestions.length,
    });
  }

  function closePlayer() {
    setPlayer(null);
    setPlayerError('');
  }

  function closeTest() {
    setActiveTest(null);
    setTestQuestions([]);
    setTestAnswers({});
    setTestError('');
    setTestResult(null);
  }

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return batches;

    return batches.filter((batch) => {
      const text = [
        batch?.title,
        batch?.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(q);
    });
  }, [batches, search]);

  const enrolledBatches = useMemo(
    () => enrolled,
    [enrolled]
  );

  function renderBatchCard(batch) {
    const enrolledNow = isEnrolled(batch);

    return (
      <div
        className="pm-card"
        key={getId(batch)}
      >
        {getBatchImage(batch) ? (
          <img
            className="pm-card-image"
            src={getBatchImage(batch)}
            alt={getTitle(batch)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="pm-card-placeholder">
            📚
          </div>
        )}

        <div className="pm-card-body">
          <h3>{getTitle(batch)}</h3>

          {getDescription(batch) && (
            <p>{getDescription(batch)}</p>
          )}

          <div className="pm-price">
            {getPrice(batch) === 'FREE'
              ? 'FREE'
              : `₹${getPrice(batch)}`}
          </div>

          <div className="pm-card-actions">
            <button
              className="pm-secondary"
              onClick={() => openBatch(batch)}
            >
              Study
            </button>

            <button
              className="pm-primary"
              onClick={() =>
                enrolledNow
                  ? openBatch(batch)
                  : enrollBatch(batch)
              }
            >
              {enrolledNow
                ? 'Enrolled'
                : 'Enroll'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderContentItem(item, index) {
    const folder = isFolder(item);
    const pdf = isPdf(item);
    const video = !pdf && isVideo(item);
    const test = isTest(item);

    let icon = '📄';

    if (folder) icon = '📁';
    else if (video) icon = '🎥';
    else if (pdf) icon = '📄';
    else if (test) icon = '📝';

    return (
      <div
        className="pm-content-item"
        key={`${getId(item)}-${index}`}
        onClick={() => {
          if (folder) {
            openFolder(item);
          } else if (pdf) {
            openPdf(item);
          } else if (video) {
            openVideo(item);
          } else if (test) {
            openTest(item);
          } else {
            setContentError(
              'Is content ka supported viewer/source available nahi hai.'
            );
          }
        }}
      >
        <div className="pm-content-icon">
          {icon}
        </div>

        <div className="pm-content-info">
          <div className="pm-content-title">
            {getTitle(item)}
          </div>

          <div className="pm-content-meta">
            {folder
              ? 'Folder'
              : pdf
              ? 'Notes / PDF'
              : video
              ? 'Video'
              : test
              ? 'Test'
              : 'Content'}
          </div>
        </div>

        <div className="pm-content-arrow">
          →
        </div>
      </div>
    );
  }

  function HomePage() {
    return (
      <>
        <div className="pm-hero">
          <div>
            <div className="pm-small">
              WELCOME TO
            </div>

            <h1>Prep Master</h1>

            <p>
              Learn smarter. Prepare better.
            </p>
          </div>
        </div>

        <div className="pm-search-wrap">
          <span>🔍</span>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search batches..."
          />
        </div>

        <div className="pm-section-head">
          <h2>Batches</h2>

          <button onClick={loadBatches}>
            ↻
          </button>
        </div>

        {loadingBatches ? (
          <div className="pm-state">
            Loading batches...
          </div>
        ) : batchError ? (
          <div className="pm-error">
            {batchError}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="pm-state">
            No batches found.
          </div>
        ) : (
          <div className="pm-grid">
            {filteredBatches.map(
              renderBatchCard
            )}
          </div>
        )}
      </>
    );
  }

  function MyBatchesPage() {
    return (
      <>
        <div className="pm-page-title">
          <h1>My Batches</h1>
          <p>Your enrolled batches</p>
        </div>

        {enrolledBatches.length === 0 ? (
          <div className="pm-empty">
            <div>📚</div>

            <h3>No enrolled batches</h3>

            <p>
              Enroll in a batch to see it here.
            </p>

            <button
              className="pm-primary pm-small-button"
              onClick={() =>
                setPage('home')
              }
            >
              Browse Batches
            </button>
          </div>
        ) : (
          <div className="pm-grid">
            {enrolledBatches.map(
              renderBatchCard
            )}
          </div>
        )}
      </>
    );
  }

  function ComingSoon({ title, icon }) {
    return (
      <div className="pm-empty">
        <div>{icon}</div>
        <h3>{title}</h3>
        <p>This feature is coming soon.</p>
      </div>
    );
  }

  function BatchPage() {
    return (
      <>
        <div className="pm-page-title">
          <button
            className="pm-back-button"
            onClick={goBackFolder}
          >
            ← Back
          </button>

          <h1>
            {currentFolder
              ? getTitle(currentFolder)
              : getTitle(selectedBatch)}
          </h1>

          <p>
            {currentFolder
              ? 'Folder content'
              : 'Course content'}
          </p>
        </div>

        {contentLoading ? (
          <div className="pm-state">
            Loading content...
          </div>
        ) : contentError ? (
          <div className="pm-error">
            {contentError}
          </div>
        ) : contentItems.length === 0 ? (
          <div className="pm-state">
            No content found.
          </div>
        ) : (
          <div className="pm-content-list">
            {contentItems.map(
              renderContentItem
            )}
          </div>
        )}
      </>
    );
  }

  function PlayerOverlay() {
    if (!player) return null;

    if (player.type === 'pdf') {
      return (
        <div className="pm-player-overlay">
          <PdfPlayer
            url={player.url}
            title={player.title}
            onClose={closePlayer}
          />
        </div>
      );
    }

    if (player.type === 'youtube') {
      return (
        <div className="pm-player-overlay">
          <div className="pm-video-player">
            <div className="pm-video-header">
              <button onClick={closePlayer}>
                ←
              </button>

              <div className="pm-video-title">
                {player.title}
              </div>
            </div>

            <div className="pm-youtube-wrap">
              <iframe
                src={player.url}
                title={player.title}
                className="pm-youtube-player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      );
    }

    if (player.type === 'video') {
      return (
        <div className="pm-player-overlay">
          <ShakaPlayer
            url={player.url}
            title={player.title}
            onClose={closePlayer}
          />
        </div>
      );
    }

    return null;
  }

  function TestOverlay() {
    if (!activeTest) return null;

    return (
      <div className="pm-test-overlay">
        <div className="pm-test-card">
          <div className="pm-test-header">
            <button onClick={closeTest}>
              ←
            </button>

            <div>
              <h2>{activeTest.title}</h2>
              <p>Test</p>
            </div>
          </div>

          {testLoading ? (
            <div className="pm-state">
              Loading test...
            </div>
          ) : testError ? (
            <div className="pm-error">
              {testError}

              <button
                className="pm-primary pm-small-button"
                onClick={startTest}
                style={{ marginTop: 12 }}
              >
                Try Again
              </button>
            </div>
          ) : testQuestions.length === 0 ? (
            <div className="pm-empty">
              <div>📝</div>

              <h3>
                Test questions not available
              </h3>

              <p>
                Instructions load hui hain, lekin
                questions response me nahi mile.
              </p>

              <button
                className="pm-primary pm-small-button"
                onClick={startTest}
              >
                Load Test Data
              </button>
            </div>
          ) : (
            <>
              <div className="pm-test-questions">
                {testQuestions.map(
                  (question, index) => {
                    const options =
                      getOptions(question);

                    return (
                      <div
                        className="pm-question"
                        key={
                          question?.id ??
                          question?.question_id ??
                          index
                        }
                      >
                        <div className="pm-question-title">
                          {index + 1}.{' '}
                          {getQuestionText(
                            question
                          )}
                        </div>

                        <div className="pm-options">
                          {options.map(
                            (option) => (
                              <label
                                className="pm-option"
                                key={option.key}
                              >
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option.key}
                                  checked={
                                    testAnswers[
                                      index
                                    ] ===
                                    option.key
                                  }
                                  onChange={() =>
                                    setTestAnswers(
                                      (prev) => ({
                                        ...prev,
                                        [index]:
                                          option.key,
                                      })
                                    )
                                  }
                                />

                                <span>
                                  {option.key}.{' '}
                                  {option.text}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {!testResult ? (
                <button
                  className="pm-primary pm-test-submit"
                  onClick={submitLocalTest}
                >
                  Submit Test
                </button>
              ) : (
                <div className="pm-test-result">
                  <h3>Test Completed 🎉</h3>

                  <p>
                    Score:{' '}
                    <strong>
                      {testResult.correct}
                    </strong>{' '}
                    / {testResult.total}
                  </p>

                  <button
                    className="pm-secondary"
                    onClick={() =>
                      setTestResult(null)
                    }
                  >
                    Retake
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  function Menu() {
    if (!menuOpen) return null;

    return (
      <div
        className="pm-menu-backdrop"
        onClick={() => setMenuOpen(false)}
      >
        <div
          className="pm-menu"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <button
            onClick={() => {
              setPage('home');
              setMenuOpen(false);
            }}
          >
            📚 Batches
          </button>

          <button
            onClick={() => {
              setPage('mybatches');
              setMenuOpen(false);
            }}
          >
            📖 My Batches
          </button>

          <button
            onClick={() => {
              setPage('community');
              setMenuOpen(false);
            }}
          >
            💬 Community
          </button>

          <button
            onClick={() => {
              setPage('ai');
              setMenuOpen(false);
            }}
          >
            🤖 AI Doubts Support
          </button>

          <a
            href={
              process.env
                .NEXT_PUBLIC_TELEGRAM_URL ||
              '#'
            }
            target="_blank"
            rel="noreferrer"
          >
            ✈️ Join Telegram
          </a>

          <a
            href={
              process.env
                .NEXT_PUBLIC_OWNER_CONTACT ||
              '#'
            }
            target="_blank"
            rel="noreferrer"
          >
            👤 Contact Owner
          </a>

          <button
            onClick={() => {
              setPage('admin');
              setMenuOpen(false);
            }}
          >
            ⚙️ Admin Panel
          </button>
        </div>
      </div>
    );
  }

  function BottomNav() {
    return (
      <nav className="pm-bottom-nav">
        <button
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
          <small>Community</small>
        </button>

        <button
          className={
            page === 'mybatches'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('mybatches')
          }
        >
          <span>📖</span>
          <small>My Batches</small>
        </button>

        <button
          className={
            page === 'home' ||
            page === 'batch'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('home')
          }
        >
          <span>📚</span>
          <small>Batches</small>
        </button>

        <button
          className={
            page === 'ai' ? 'active' : ''
          }
          onClick={() => setPage('ai')}
        >
          <span>🤖</span>
          <small>AI Doubts</small>
        </button>
      </nav>
    );
  }

  let mainContent = null;

  if (page === 'home') {
    mainContent = <HomePage />;
  } else if (page === 'mybatches') {
    mainContent = <MyBatchesPage />;
  } else if (page === 'batch') {
    mainContent = <BatchPage />;
  } else if (page === 'community') {
    mainContent = (
      <ComingSoon
        title="Community"
        icon="💬"
      />
    );
  } else if (page === 'ai') {
    mainContent = (
      <ComingSoon
        title="AI Doubts Support"
        icon="🤖"
      />
    );
  } else if (page === 'admin') {
    mainContent = (
      <ComingSoon
        title="Admin Panel"
        icon="⚙️"
      />
    );
  }

  return (
    <div className="pm-app">
      <header className="pm-header">
        <div className="pm-brand">
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
            className="pm-logo"
          />

          <span>Prep Master</span>
        </div>

        <button
          className="pm-menu-button"
          onClick={() =>
            setMenuOpen((value) => !value)
          }
          aria-label="Open menu"
        >
          ⋮
        </button>
      </header>

      <main className="pm-main">
        {mainContent}
      </main>

      <BottomNav />

      <Menu />

      {enrollPopup && (
        <div
          className="pm-popup-backdrop"
          onClick={() =>
            setEnrollPopup(null)
          }
        >
          <div
            className="pm-popup"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="pm-popup-icon">
              🎉
            </div>

            <h2>Congratulations 🎉</h2>

            <p>
              You have successfully enrolled
              in{' '}
              <strong>
                {getTitle(enrollPopup)}
              </strong>.
            </p>

            <button
              className="pm-primary"
              onClick={() =>
                setEnrollPopup(null)
              }
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {playerLoading && (
        <div className="pm-popup-backdrop">
          <div className="pm-popup">
            <div className="pm-popup-icon">
              🎥
            </div>

            <h3>Loading...</h3>

            <p>
              Please wait while the content
              loads.
            </p>
          </div>
        </div>
      )}

      {playerError && !player && (
        <div className="pm-popup-backdrop">
          <div className="pm-popup">
            <div className="pm-popup-icon">
              ⚠️
            </div>

            <h3>Unable to open content</h3>

            <p>{playerError}</p>

            <button
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

      <PlayerOverlay />

      <TestOverlay />
    </div>
  );
}
