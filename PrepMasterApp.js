'use client';

import { useEffect, useMemo, useState } from 'react';

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
    title.includes('notes')
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
      alert(
        'Is note ka PDF source available nahi hai. Source API ne actual PDF URL provide nahi kiya.'
      );
      return;
    }

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

      setTestQuestions(
        getTestQuestions(json?.data)
      );
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

      const questions = getTestQuestions(
        json?.data
      );

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
      <div className="pm-card" key={getId(batch)}>
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
              {enrolledNow ? 'Enrolled' : 'Enroll'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderContentItem(item, index) {
    const folder = isFolder(item);
    const video = isVideo(item);
    const pdf = isPdf(item);
    const test = isTest(item);

    let icon = '📄';

    if (folder) icon = '📁';
    else if (video) icon = '🎥';
    else if (pdf) icon = '📄';
    else if (test) icon = '📝';

    const locked =
      item?.is_locked === 1 ||
      item?.data?.is_locked === 1;

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
            alert(
              'Is content type ka viewer abhi available nahi hai.'
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

            {locked ? ' • 🔒' : ''}
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
              onClick={() => setPage('home')}
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
            <div>📂</div>
            <h3>No content found</h3>
            <p>
              There is no content in this folder.
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

  function TestScreen() {
    if (!activeTest) return null;

    return (
      <div className="pm-test-overlay">
        <div className="pm-test-card">
          <div className="pm-test-top">
            <button
              onClick={closeTest}
              className="pm-back"
            >
              ← Close
            </button>

            <h2>{activeTest.title}</h2>
          </div>

          {testLoading ? (
            <div className="pm-state">
              Loading test...
            </div>
          ) : testError ? (
            <div className="pm-error">
              {testError}

              <button
                className="pm-primary pm-retry"
                onClick={startTest}
              >
                Retry
              </button>
            </div>
          ) : testQuestions.length === 0 ? (
            <div className="pm-empty">
              <div>📝</div>
              <h3>Test data unavailable</h3>
              <p>
                Try loading the test again.
              </p>

              <button
                className="pm-primary pm-small-button"
                onClick={startTest}
              >
                Start Test
              </button>
            </div>
          ) : testResult ? (
            <div className="pm-test-result">
              <div className="pm-result-icon">
                🎉
              </div>

              <h2>Test Completed</h2>

              <div className="pm-score">
                {testResult.correct} /{' '}
                {testResult.total}
              </div>

              <button
                className="pm-primary pm-small-button"
                onClick={() => {
                  setTestResult(null);
                  setTestAnswers({});
                }}
              >
                Try Again
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
                        key={index}
                      >
                        <h3>
                          {index + 1}.{' '}
                          {getQuestionText(
                            question
                          )}
                        </h3>

                        <div className="pm-options">
                          {options.map(
                            (option) => (
                              <label
                                className={`pm-option ${
                                  String(
                                    testAnswers[
                                      index
                                    ] ?? ''
                                  ) ===
                                  String(
                                    option.key
                                  )
                                    ? 'selected'
                                    : ''
                                }`}
                                key={option.key}
                              >
                                <input
                                  type="radio"
                                  name={`q-${index}`}
                                  value={
                                    option.key
                                  }
                                  checked={
                                    String(
                                      testAnswers[
                                        index
                                      ] ?? ''
                                    ) ===
                                    String(
                                      option.key
                                    )
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

              <button
                className="pm-primary pm-submit-test"
                onClick={submitLocalTest}
              >
                Submit Test
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="pm-app">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #f7f9fc;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          color: #172033;
        }

        button,
        input {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .pm-app {
          min-height: 100vh;
          background: #f7f9fc;
          padding-bottom: 84px;
        }

        .pm-header {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 64px;
          background: rgba(255,255,255,.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #e9edf3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
        }

        .pm-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .pm-brand img {
          width: 38px;
          height: 38px;
          object-fit: contain;
          border-radius: 10px;
        }

        .pm-brand strong {
          font-size: 19px;
          white-space: nowrap;
        }

        .pm-menu-button {
          width: 40px;
          height: 40px;
          border: 0;
          background: #f3f6fa;
          border-radius: 12px;
          font-size: 21px;
        }

        .pm-menu {
          position: fixed;
          top: 70px;
          right: 14px;
          z-index: 500;
          width: 245px;
          background: white;
          border: 1px solid #e7ebf1;
          border-radius: 18px;
          padding: 8px;
          box-shadow:
            0 18px 50px rgba(30,45,70,.16);
        }

        .pm-menu button {
          width: 100%;
          padding: 13px 12px;
          border: 0;
          background: transparent;
          text-align: left;
          border-radius: 12px;
          font-size: 15px;
        }

        .pm-menu button:hover {
          background: #f4f7fb;
        }

        .pm-main {
          width: min(1180px, 100%);
          margin: auto;
          padding: 20px 16px 30px;
        }

        .pm-hero {
          background: white;
          border: 1px solid #e8edf3;
          border-radius: 24px;
          padding: 26px;
          margin-bottom: 16px;
        }

        .pm-small {
          font-size: 12px;
          color: #7b8799;
          font-weight: 700;
          letter-spacing: .08em;
        }

        .pm-hero h1 {
          margin: 7px 0 4px;
          font-size: clamp(28px, 6vw, 42px);
        }

        .pm-hero p,
        .pm-page-title p {
          margin: 0;
          color: #758196;
        }

        .pm-search-wrap {
          height: 50px;
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 15px;
          margin-bottom: 24px;
        }

        .pm-search-wrap input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
        }

        .pm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .pm-section-head h2 {
          margin: 0;
          font-size: 21px;
        }

        .pm-section-head button {
          border: 0;
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 10px;
          width: 38px;
          height: 38px;
        }

        .pm-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .pm-card {
          overflow: hidden;
          background: white;
          border: 1px solid #e6ebf1;
          border-radius: 18px;
          box-shadow:
            0 5px 20px rgba(35,55,85,.05);
        }

        .pm-card-image,
        .pm-card-placeholder {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          display: block;
        }

        .pm-card-placeholder {
          background: #edf4ff;
          display: grid;
          place-items: center;
          font-size: 42px;
        }

        .pm-card-body {
          padding: 15px;
        }

        .pm-card-body h3 {
          margin: 0 0 7px;
          font-size: 17px;
        }

        .pm-card-body p {
          color: #788398;
          font-size: 13px;
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pm-price {
          font-weight: 800;
          margin-bottom: 13px;
        }

        .pm-card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .pm-primary,
        .pm-secondary {
          min-height: 42px;
          border-radius: 11px;
          padding: 0 14px;
          font-weight: 700;
        }

        .pm-primary {
          color: white;
          border: 0;
          background: #1769ff;
        }

        .pm-secondary {
          color: #1769ff;
          background: white;
          border: 1px solid #bcd2ff;
        }

        .pm-page-title {
          margin: 5px 0 22px;
        }

        .pm-page-title h1 {
          margin: 5px 0;
          font-size: 27px;
        }

        .pm-back {
          border: 0;
          background: transparent;
          color: #1769ff;
          padding: 0;
          font-weight: 700;
        }

        .pm-state,
        .pm-error,
        .pm-empty,
        .pm-coming {
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 18px;
          padding: 28px;
          text-align: center;
        }

        .pm-error {
          color: #b42318;
          background: #fff7f6;
          border-color: #ffd7d2;
        }

        .pm-empty > div,
        .pm-coming-icon {
          font-size: 42px;
        }

        .pm-empty h3,
        .pm-coming h2 {
          margin: 10px 0 6px;
        }

        .pm-empty p,
        .pm-coming p {
          margin: 0 0 18px;
          color: #788398;
        }

        .pm-small-button {
          padding: 0 18px;
        }

        .pm-content-list {
          display: grid;
          gap: 10px;
        }

        .pm-content-item {
          min-height: 70px;
          display: flex;
          align-items: center;
          gap: 13px;
          background: white;
          border: 1px solid #e5eaf0;
          border-radius: 15px;
          padding: 11px 14px;
          cursor: pointer;
          transition: .15s ease;
        }

        .pm-content-item:hover {
          transform: translateY(-1px);
          box-shadow:
            0 7px 20px rgba(30,50,80,.07);
        }

        .pm-content-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #edf4ff;
          display: grid;
          place-items: center;
          font-size: 22px;
          flex: 0 0 auto;
        }

        .pm-content-info {
          min-width: 0;
          flex: 1;
        }

        .pm-content-title {
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pm-content-meta {
          margin-top: 4px;
          color: #7b8799;
          font-size: 12px;
        }

        .pm-content-arrow {
          color: #8b96a8;
          font-size: 20px;
        }

        .pm-bottom {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 200;
          height: 70px;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(12px);
          border-top: 1px solid #e5eaf0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          padding: 5px 8px;
        }

        .pm-bottom button {
          border: 0;
          background: transparent;
          color: #7b8799;
          font-size: 11px;
        }

        .pm-bottom button.active {
          color: #1769ff;
          font-weight: 800;
        }

        .pm-bottom span {
          display: block;
          font-size: 21px;
          margin-bottom: 2px;
        }

        .pm-popup-backdrop,
        .pm-player-overlay,
        .pm-test-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(9,18,32,.55);
          display: grid;
          place-items: center;
          padding: 16px;
        }

        .pm-popup {
          width: min(420px, 100%);
          background: white;
          border-radius: 22px;
          padding: 28px;
          text-align: center;
        }

        .pm-popup-logo {
          width: 65px;
          height: 65px;
          object-fit: contain;
          margin-bottom: 8px;
        }

        .pm-popup h2 {
          margin: 5px 0 8px;
        }

        .pm-popup p {
          color: #778398;
        }

        .pm-popup button {
          width: 100%;
          margin-top: 8px;
        }

        .pm-player {
          width: min(1100px, 100%);
          height: min(88vh, 760px);
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .pm-player-header {
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
          border-bottom: 1px solid #e5eaf0;
        }

        .pm-player-header strong {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pm-player-close {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 10px;
          background: #f1f4f8;
        }

        .pm-video {
          width: 100%;
          height: 100%;
          background: #000;
          object-fit: contain;
        }

        .pm-pdf-frame {
          width: 100%;
          flex: 1;
          border: 0;
          background: #f2f4f7;
        }

        .pm-test-card {
          width: min(850px, 100%);
          max-height: 92vh;
          overflow: auto;
          background: white;
          border-radius: 20px;
          padding: 20px;
        }

        .pm-test-top {
          position: sticky;
          top: -20px;
          background: white;
          padding: 5px 0 15px;
          border-bottom: 1px solid #e8edf3;
          z-index: 2;
        }

        .pm-test-top h2 {
          margin: 10px 0 0;
        }

        .pm-question {
          padding: 18px 0;
          border-bottom: 1px solid #edf0f4;
        }

        .pm-question h3 {
          margin: 0 0 12px;
          font-size: 16px;
        }

        .pm-options {
          display: grid;
          gap: 8px;
        }

        .pm-option {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px;
          border: 1px solid #e3e8ef;
          border-radius: 11px;
        }

        .pm-option.selected {
          border-color: #1769ff;
          background: #f1f6ff;
        }

        .pm-submit-test {
          width: 100%;
          margin-top: 18px;
        }

        .pm-test-result {
          text-align: center;
          padding: 50px 15px;
        }

        .pm-result-icon {
          font-size: 50px;
        }

        .pm-score {
          font-size: 42px;
          font-weight: 900;
          margin: 15px 0 25px;
        }

        .pm-retry {
          margin-top: 15px;
        }

        @media (max-width: 600px) {
          .pm-main {
            padding: 15px 12px 25px;
          }

          .pm-hero {
            padding: 21px;
          }

          .pm-grid {
            grid-template-columns: 1fr;
          }

          .pm-player {
            width: 100%;
            height: 94vh;
            border-radius: 14px;
          }

          .pm-popup-backdrop,
          .pm-player-overlay,
          .pm-test-overlay {
            padding: 8px;
          }

          .pm-test-card {
            max-height: 96vh;
          }
        }
      `}</style>

      <header className="pm-header">
        <div className="pm-brand">
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
            onError={(e) => {
              e.currentTarget.src =
                '/prep-master-icon.png';
            }}
          />

          <strong>Prep Master</strong>
        </div>

        <button
          className="pm-menu-button"
          onClick={() =>
            setMenuOpen((prev) => !prev)
          }
        >
          ⋮
        </button>
      </header>

      {menuOpen && (
        <div className="pm-menu">
          <button
            onClick={() => {
              setMenuOpen(false);
              setPage('home');
            }}
          >
            📚 Batches
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              setPage('mybatches');
            }}
          >
            📖 My Batches
          </button>

          <button
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
              }
            }}
          >
            ✈️ Join Telegram
          </button>

          <button
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
              }
            }}
          >
            👤 Contact Owner
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              alert(
                'Admin Panel will be available soon.'
              );
            }}
          >
            ⚙️ Admin Panel
          </button>
        </div>
      )}

      <div className="pm-main">
        {page === 'home' && <HomePage />}

        {page === 'mybatches' && (
          <MyBatchesPage />
        )}

        {page === 'batch' && <BatchPage />}

        {page === 'community' && (
          <ComingSoon
            title="Community"
            icon="💬"
          />
        )}

        {page === 'ai' && (
          <ComingSoon
            title="AI Doubts"
            icon="🤖"
          />
        )}
      </div>

      <nav className="pm-bottom">
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
          Community
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
          My Batches
        </button>

        <button
          className={
            page === 'home' ||
            page === 'batch'
              ? 'active'
              : ''
          }
          onClick={() => setPage('home')}
        >
          <span>📚</span>
          Batches
        </button>

        <button
          className={
            page === 'ai' ? 'active' : ''
          }
          onClick={() => setPage('ai')}
        >
          <span>🤖</span>
          AI Doubts
        </button>
      </nav>

      {enrollPopup && (
        <div className="pm-popup-backdrop">
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
              You have successfully enrolled
              in <strong>
                {getTitle(enrollPopup)}
              </strong>.
            </p>

            <button
              className="pm-primary"
              onClick={() => {
                setEnrollPopup(null);
                openBatch(enrollPopup);
              }}
            >
              Start Studying
            </button>

            <button
              className="pm-secondary"
              onClick={() =>
                setEnrollPopup(null)
              }
            >
              Close
            </button>
          </div>
        </div>
      )}

      {player && (
        <div className="pm-player-overlay">
          <div className="pm-player">
            <div className="pm-player-header">
              <button
                className="pm-player-close"
                onClick={closePlayer}
              >
                ←
              </button>

              <strong>
                {player.title}
              </strong>

              {player.type === 'pdf' && (
                <a
                  href={player.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-secondary"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    textDecoration: 'none',
                    minHeight: 36,
                  }}
                >
                  Open
                </a>
              )}
            </div>

            {player.type === 'video' && (
              <video
                className="pm-video"
                src={player.url}
                controls
                playsInline
                autoPlay
              />
            )}

            {player.type === 'pdf' && (
              <iframe
                className="pm-pdf-frame"
                src={player.url}
                title={player.title}
              />
            )}
          </div>
        </div>
      )}

      {playerLoading && (
        <div className="pm-popup-backdrop">
          <div className="pm-popup">
            <h2>Loading...</h2>
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
            <h2>Unable to play</h2>
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

      {activeTest && <TestScreen />}
    </main>
  );
}
