'use client';

import { useEffect, useMemo, useState } from 'react';
import PdfPlayer from './PdfPlayer';

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

function getThumbnail(item) {
  return (
    item?.thumbnail ??
    item?.image ??
    item?.banner ??
    item?.data?.thumbnail ??
    ''
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
    item?.data?.folders
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

function isVideo(item) {
  const type = getFileType(item);
  const videoType = getVideoType(item);

  const url =
    item?.file_url ||
    item?.data?.file_url ||
    item?.url ||
    item?.data?.url ||
    '';

  return (
    type === 2 ||
    videoType > 0 ||
    /\.(m3u8|mp4)(\?|$)/i.test(url)
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
      item?.data?.title ??
      ''
  ).toLowerCase();

  const url = String(
    item?.file_url ??
      item?.data?.file_url ??
      item?.pdf_url ??
      item?.data?.pdf_url ??
      item?.url ??
      item?.data?.url ??
      ''
  );

  return (
    kind === 'pdf' ||
    kind === 'notes' ||
    kind === 'note' ||
    item?.has_pdf === 1 ||
    item?.has_pdf === '1' ||
    Boolean(item?.pdf_url) ||
    Boolean(item?.data?.pdf_url) ||
    /\.pdf(\?|$)/i.test(url) ||
    title.includes('notes') ||
    title.includes('note')
  );
}

function getPdfUrl(item) {
  return (
    item?.pdf_url ||
    item?.data?.pdf_url ||
    item?.file_url ||
    item?.data?.file_url ||
    item?.url ||
    item?.data?.url ||
    ''
  );
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
    return Object.entries(options).map(
      ([key, value]) => ({
        key,
        text:
          typeof value === 'string'
            ? value
            : value?.text ??
              value?.value ??
              value?.title ??
              '',
      })
    );
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
        error?.message ||
          'Unable to load batches.'
      );
    } finally {
      setLoadingBatches(false);
    }
  }

  function isEnrolled(batch) {
    const id = getId(batch);

    return enrolled.some(
      (item) =>
        String(getId(item)) === String(id)
    );
  }

  function enrollBatch(batch) {
    if (!batch) return;

    if (!isEnrolled(batch)) {
      setEnrolled((prev) => [
        ...prev,
        batch,
      ]);
    }

    setEnrollPopup(batch);
  }

  function openBatch(batch) {
    setSelectedBatch(batch);
    setCurrentFolder(null);
    setFolderStack([]);
    setContentItems([]);
    setContentError('');
    setPage('batch');

    loadContent(getId(batch), '0');
  }

  async function loadContent(
    courseId,
    folderId = '0'
  ) {
    if (!courseId) return;

    setContentLoading(true);
    setContentError('');

    try {
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

      if (!response.ok || !json?.success) {
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
        ? nextStack[
            nextStack.length - 1
          ].id
        : '0';

    setCurrentFolder(
      nextStack.length > 0
        ? nextStack[
            nextStack.length - 1
          ]
        : null
    );

    loadContent(
      getId(selectedBatch),
      parentId
    );
  }

  async function openVideo(item) {
    if (!selectedBatch) return;

    const contentId = getId(item);

    if (!contentId) {
      alert('Video ID unavailable.');
      return;
    }

    setPlayerLoading(true);
    setPlayerError('');
    setPlayer(null);

    try {
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

      if (!json?.url) {
        throw new Error(
          'No playable video URL was returned.'
        );
      }

      setPlayer({
        type: 'video',
        title: getTitle(item),
        url: json.url,
      });
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
        if (response.status === 401) {
          throw new Error(
            'Test access authorized nahi hai. Test API ne 401 Unauthorized return kiya.'
          );
        }

        throw new Error(
          json?.error ||
            `Test source returned HTTP ${response.status}`
        );
      }

      const questions =
        getTestQuestions(json?.data);

      setTestQuestions(questions);
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
        if (response.status === 401) {
          throw new Error(
            'Test access authorized nahi hai. Test API ne 401 Unauthorized return kiya.'
          );
        }

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

    testQuestions.forEach(
      (question, index) => {
        const selected =
          testAnswers[index];

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
      }
    );

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
    const q = search
      .trim()
      .toLowerCase();

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
    const enrolledNow =
      isEnrolled(batch);

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
            <p>
              {getDescription(batch)}
            </p>
          )}

          <div className="pm-price">
            {getPrice(batch) === 'FREE'
              ? 'FREE'
              : `₹${getPrice(batch)}`}
          </div>

          <div className="pm-card-actions">
            <button
              className="pm-secondary"
              onClick={() =>
                openBatch(batch)
              }
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

  function renderContentItem(
    item,
    index
  ) {
    const folder = isFolder(item);
    const video = isVideo(item);
    const pdf = isPdf(item);
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
          } else if (video) {
            openVideo(item);
          } else if (pdf) {
            openPdf(item);
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
              : video
              ? 'Video'
              : pdf
              ? 'Notes / PDF'
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
        ) : filteredBatches.length ===
          0 ? (
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
          <p>
            Your enrolled batches
          </p>
        </div>

        {enrolledBatches.length ===
        0 ? (
          <div className="pm-empty">
            <div>📚</div>

            <h3>
              No enrolled batches
            </h3>

            <p>
              Enroll in a batch to see it
              here.
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

  function ComingSoon({
    title,
    icon,
  }) {
    return (
      <div className="pm-coming">
        <div className="pm-coming-icon">
          {icon}
        </div>

        <h2>{title}</h2>

        <p>
          This feature is coming soon.
        </p>
      </div>
    );
  }

  function BatchPage() {
    return (
      <>
        <div className="pm-page-title pm-batch-head">
          <div>
            <button
              className="pm-back"
              onClick={goBackFolder}
            >
              ← Back
            </button>

            <h1>
              {currentFolder
                ? currentFolder.title
                : getTitle(selectedBatch)}
            </h1>

            <p>
              {currentFolder
                ? 'Course content'
                : 'Study materials'}
            </p>
          </div>
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
          <div className="pm-empty">
            <div>📚</div>

            <h3>
              No content found
            </h3>

            <p>
              Is folder me abhi content
              available nahi hai.
            </p>
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

  function TestOverlay() {
    if (!activeTest) return null;

    return (
      <div className="pm-popup-overlay">
        <div className="pm-popup pm-test-popup">
          <div className="pm-popup-top">
            <button
              className="pm-close"
              onClick={closeTest}
            >
              ✕
            </button>
          </div>

          <h2>
            {activeTest.title}
          </h2>

          {testLoading ? (
            <div className="pm-state">
              Loading test...
            </div>
          ) : testError ? (
            <div className="pm-error">
              {testError}
            </div>
          ) : testResult ? (
            <div className="pm-test-result">
              <div className="pm-result-icon">
                🎉
              </div>

              <h3>
                Test Submitted
              </h3>

              <p>
                Score:{" "}
                <strong>
                  {testResult.correct}
                </strong>{" "}
                /{" "}
                {testResult.total}
              </p>

              <button
                className="pm-primary"
                onClick={closeTest}
              >
                Close
              </button>
            </div>
          ) : testQuestions.length ===
            0 ? (
            <div className="pm-test-start">
              <div className="pm-result-icon">
                📝
              </div>

              <p>
                Test questions load karne
                ke liye Start Test dabao.
              </p>

              <button
                className="pm-primary"
                onClick={startTest}
              >
                Start Test
              </button>
            </div>
          ) : (
            <div className="pm-test-page">
              {testQuestions.map(
                (question, index) => {
                  const options =
                    getOptions(question);

                  return (
                    <div
                      className="pm-test-question"
                      key={index}
                    >
                      <div className="pm-test-question-title">
                        {index + 1}.{" "}
                        {getQuestionText(
                          question
                        )}
                      </div>

                      {options.map(
                        (option) => (
                          <label
                            className="pm-test-option"
                            key={option.key}
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={
                                option.key
                              }
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
                              <strong>
                                {
                                  option.key
                                }
                                .
                              </strong>{" "}
                              {option.text}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  );
                }
              )}

              <button
                className="pm-test-submit"
                onClick={
                  submitLocalTest
                }
              >
                Submit Test
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function PlayerOverlay() {
    if (!player && !playerLoading && !playerError) {
      return null;
    }

    if (
      player?.type === 'pdf'
    ) {
      return (
        <PdfPlayer
          url={player.url}
          title={player.title}
          onClose={closePlayer}
        />
      );
    }

    return (
      <div className="pm-player-overlay">
        <div className="pm-player-header">
          <button
            onClick={closePlayer}
          >
            ←
          </button>

          <div className="pm-player-title">
            {player?.title ||
              'Player'}
          </div>
        </div>

        <div className="pm-player-content">
          {playerLoading ? (
            <div className="pm-loading">
              Loading...
            </div>
          ) : playerError ? (
            <div className="pm-error">
              {playerError}
            </div>
          ) : player?.type ===
            'video' ? (
            <video
              src={player.url}
              controls
              playsInline
              autoPlay
            />
          ) : null}
        </div>
      </div>
    );
  }

  function SideMenu() {
    if (!menuOpen) return null;

    return (
      <div
        className="pm-menu-overlay"
        onClick={() =>
          setMenuOpen(false)
        }
      >
        <div
          className="pm-menu"
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <div className="pm-menu-header">
            <div className="pm-menu-title">
              Prep Master
            </div>

            <button
              className="pm-menu-close"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              ✕
            </button>
          </div>

          <div className="pm-menu-list">
            <button
              className="pm-menu-item"
              onClick={() => {
                setPage('home');
                setMenuOpen(false);
              }}
            >
              📚 Batches
            </button>

            <button
              className="pm-menu-item"
              onClick={() => {
                setPage('my');
                setMenuOpen(false);
              }}
            >
              📖 My Batches
            </button>

            <button
              className="pm-menu-item"
              onClick={() => {
                const url =
                  process.env
                    .NEXT_PUBLIC_TELEGRAM_URL;

                if (url) {
                  window.open(
                    url,
                    '_blank',
                    'noopener,noreferrer'
                  );
                } else {
                  alert(
                    'Telegram link configured nahi hai.'
                  );
                }
              }}
            >
              ✈️ Join Telegram
            </button>

            <button
              className="pm-menu-item"
              onClick={() => {
                const url =
                  process.env
                    .NEXT_PUBLIC_OWNER_CONTACT;

                if (url) {
                  window.open(
                    url,
                    '_blank',
                    'noopener,noreferrer'
                  );
                } else {
                  alert(
                    'Owner contact configured nahi hai.'
                  );
                }
              }}
            >
              👤 Contact Owner
            </button>

            <button
              className="pm-menu-item"
              onClick={() => {
                alert(
                  'Admin Panel coming soon.'
                );
              }}
            >
              ⚙️ Admin Panel
            </button>
          </div>
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
          <span className="pm-bottom-nav-icon">
            💬
          </span>

          <span>
            Community
          </span>
        </button>

        <button
          className={
            page === 'my'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('my')
          }
        >
          <span className="pm-bottom-nav-icon">
            📖
          </span>

          <span>
            My Batches
          </span>
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
          <span className="pm-bottom-nav-icon">
            📚
          </span>

          <span>
            Batches
          </span>
        </button>

        <button
          className={
            page === 'ai'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('ai')
          }
        >
          <span className="pm-bottom-nav-icon">
            🤖
          </span>

          <span>
            AI Doubts
          </span>
        </button>
      </nav>
    );
  }

  function renderPage() {
    if (page === 'my') {
      return <MyBatchesPage />;
    }

    if (page === 'community') {
      return (
        <ComingSoon
          title="Community"
          icon="💬"
        />
      );
    }

    if (page === 'ai') {
      return (
        <ComingSoon
          title="AI Doubts"
          icon="🤖"
        />
      );
    }

    if (page === 'batch') {
      return <BatchPage />;
    }

    return <HomePage />;
  }

  return (
    <div className="pm-app">
      <header className="pm-header">
        <div className="pm-brand">
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
          />

          <div className="pm-brand-title">
            Prep Master
          </div>
        </div>

        <button
          className="pm-menu-button"
          onClick={() =>
            setMenuOpen(true)
          }
          aria-label="Open menu"
        >
          ⋮
        </button>
      </header>

      <main className="pm-container">
        {renderPage()}
      </main>

      <BottomNav />

      <SideMenu />

      {enrollPopup && (
        <div className="pm-popup-overlay">
          <div className="pm-popup">
            <img
              className="pm-popup-logo"
              src="/prep-master-icon.png"
              alt="Prep Master"
            />

            <h2>
              Congratulations 🎉
            </h2>

            <p>
              You have successfully
              enrolled in this batch.
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

      <PlayerOverlay />

      <TestOverlay />
    </div>
  );
}
