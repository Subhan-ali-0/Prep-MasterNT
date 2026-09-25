'use client';

import { useEffect, useMemo, useState } from 'react';

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ||
  'https://t.me/prepmaster0';

const OWNER_URL =
  process.env.NEXT_PUBLIC_OWNER_CONTACT ||
  'https://t.me/Subhanali011';

/* =========================
   HELPERS
========================= */

function getId(item) {
  return String(
    item?.entity_id ??
      item?.id ??
      item?.data?.id ??
      item?.course_id ??
      item?.courseId ??
      ''
  );
}

function getTitle(item) {
  return (
    item?.title ??
    item?.name ??
    item?.data?.title ??
    item?.data?.name ??
    'Untitled'
  );
}

function getThumbnail(item) {
  return (
    item?.thumbnail ??
    item?.image ??
    item?.banner ??
    item?.data?.thumbnail ??
    item?.data?.image ??
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

/* =========================
   FOLDER DETECTION
========================= */

function isFolder(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const directType = String(
    item?.type ?? ''
  ).toLowerCase();

  const nestedType = String(
    item?.data?.type ?? ''
  ).toLowerCase();

  if (
    directType === 'folder' ||
    nestedType === 'folder'
  ) {
    return true;
  }

  /*
   * Important:
   * Do NOT use content_counts.folders here.
   * A content/file can also contain folder counts.
   */

  return false;
}

/* =========================
   FILE TYPE
========================= */

function getFileType(item) {
  const value =
    item?.file_type ??
    item?.content_type ??
    item?.data?.file_type ??
    item?.data?.content_type ??
    item?.fileType ??
    item?.contentType ??
    item?.data?.fileType ??
    item?.data?.contentType ??
    '';

  return String(value)
    .toLowerCase()
    .trim();
}

function getVideoType(item) {
  const value =
    item?.video_type ??
    item?.data?.video_type ??
    item?.videoType ??
    item?.data?.videoType ??
    '';

  return String(value)
    .toLowerCase()
    .trim();
}

function getContentKind(item) {
  return String(
    item?.type ??
      item?.data?.type ??
      item?.content_type ??
      item?.data?.content_type ??
      item?.contentType ??
      item?.data?.contentType ??
      ''
  )
    .toLowerCase()
    .trim();
}

/* =========================
   VIDEO
========================= */

function isVideo(item) {
  if (!item) return false;

  const type = getFileType(item);
  const videoType = getVideoType(item);
  const kind = getContentKind(item);

  const url = String(
    item?.file_url ??
      item?.data?.file_url ??
      item?.url ??
      item?.data?.url ??
      ''
  );

  if (
    kind === 'video' ||
    kind === 'videos'
  ) {
    return true;
  }

  if (
    type === '2' ||
    type === 'video' ||
    type === 'videos'
  ) {
    return true;
  }

  if (
    videoType &&
    videoType !== '0' &&
    videoType !== 'null' &&
    videoType !== 'undefined'
  ) {
    return true;
  }

  if (
    item?.is_video === true ||
    item?.data?.is_video === true
  ) {
    return true;
  }

  if (
    /\.(m3u8|mp4|webm)(\?|$)/i.test(url)
  ) {
    return true;
  }

  return false;
}

/* =========================
   PDF
========================= */

function isPdf(item) {
  if (!item) return false;

  const type = getFileType(item);
  const kind = getContentKind(item);

  const url = String(
    item?.file_url ??
      item?.data?.file_url ??
      item?.pdf_url ??
      item?.data?.pdf_url ??
      item?.url ??
      item?.data?.url ??
      ''
  );

  if (
    kind === 'pdf' ||
    kind === 'document' ||
    kind === 'notes'
  ) {
    return true;
  }

  if (
    type === '3' ||
    type === 'pdf' ||
    type === 'document' ||
    type === 'notes'
  ) {
    return true;
  }

  if (
    item?.has_pdf === 1 ||
    item?.has_pdf === '1' ||
    item?.has_pdf === true ||
    item?.data?.has_pdf === 1 ||
    item?.data?.has_pdf === '1' ||
    item?.data?.has_pdf === true
  ) {
    return true;
  }

  if (
    item?.pdf_url ||
    item?.data?.pdf_url
  ) {
    return true;
  }

  if (/\.pdf(\?|$)/i.test(url)) {
    return true;
  }

  return false;
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

/* =========================
   TEST
========================= */

function isTest(item) {
  if (!item) return false;

  const kind = getContentKind(item);

  const title = getTitle(item)
    .toLowerCase();

  return (
    kind === 'test' ||
    kind === 'tests' ||
    item?.type === 'test' ||
    item?.data?.type === 'test' ||
    title.includes('test') ||
    title.includes('quiz') ||
    title.includes('mock test') ||
    title.includes('sample paper') ||
    title.includes('question paper')
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

/* =========================
   PRICE
========================= */

function getPrice(item) {
  const price =
    item?.offer_price ??
    item?.price ??
    item?.data?.offer_price ??
    item?.data?.price ??
    '';

  if (
    price === '' ||
    price === null ||
    price === undefined
  ) {
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

/* =========================
   MAIN APP
========================= */

export default function PrepMasterApp() {
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] =
    useState(true);
  const [batchError, setBatchError] =
    useState('');

  const [page, setPage] =
    useState('home');

  const [search, setSearch] =
    useState('');

  const [selectedBatch, setSelectedBatch] =
    useState(null);

  const [selectedFolder, setSelectedFolder] =
    useState(null);

  const [contentItems, setContentItems] =
    useState([]);

  const [folderStack, setFolderStack] =
    useState([]);

  const [contentLoading, setContentLoading] =
    useState(false);

  const [contentError, setContentError] =
    useState('');

  const [player, setPlayer] =
    useState(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [enrollBatch, setEnrollBatch] =
    useState(null);

  const [enrolled, setEnrolled] =
    useState([]);

  const [testInstructions, setTestInstructions] =
    useState(null);

  const [testData, setTestData] =
    useState(null);

  const [testLoading, setTestLoading] =
    useState(false);

  const [testError, setTestError] =
    useState('');

  const [activeTest, setActiveTest] =
    useState(null);

  const [testAnswers, setTestAnswers] =
    useState({});

  const [testIndex, setTestIndex] =
    useState(0);

  const [testResult, setTestResult] =
    useState(null);

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadBatches();

    try {
      const saved = JSON.parse(
        localStorage.getItem(
          'pm_enrolled'
        ) || '[]'
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

  /* =========================
     LOAD BATCHES
  ========================= */

  async function loadBatches() {
    setLoadingBatches(true);
    setBatchError('');

    try {
      const response = await fetch(
        '/api/batches'
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            'Unable to load batches.'
        );
      }

      setBatches(
        Array.isArray(data.batches)
          ? data.batches
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

  /* =========================
     LOAD CONTENT
  ========================= */

  async function loadContent(
    courseId,
    folderId = '0'
  ) {
    setContentLoading(true);
    setContentError('');

    try {
      const url =
        `/api/content?content=${encodeURIComponent(
          courseId
        )}&folder=${encodeURIComponent(
          folderId
        )}`;

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            'Unable to load content.'
        );
      }

      setContentItems(
        Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (error) {
      setContentItems([]);
      setContentError(
        error?.message ||
          'Unable to load content.'
      );
    } finally {
      setContentLoading(false);
    }
  }

  /* =========================
     OPEN BATCH
  ========================= */

  async function openBatch(batch) {
    setSelectedBatch(batch);
    setSelectedFolder(null);
    setFolderStack([]);
    setContentItems([]);
    setContentError('');
    setPage('content');

    await loadContent(
      getId(batch),
      '0'
    );
  }

  /* =========================
     OPEN FOLDER
  ========================= */

  async function openFolder(folder) {
    const folderId = getId(folder);

    if (
      !folderId ||
      !selectedBatch
    ) {
      return;
    }

    setFolderStack((prev) => [
      ...prev,
      {
        folder: selectedFolder,
        items: contentItems,
      },
    ]);

    setSelectedFolder(folder);

    await loadContent(
      getId(selectedBatch),
      folderId
    );
  }

  /* =========================
     BACK FOLDER
  ========================= */

  async function goBackFolder() {
    if (!selectedBatch) {
      return;
    }

    if (folderStack.length === 0) {
      setSelectedFolder(null);

      await loadContent(
        getId(selectedBatch),
        '0'
      );

      return;
    }

    const previous =
      folderStack[
        folderStack.length - 1
      ];

    setFolderStack((prev) =>
      prev.slice(0, -1)
    );

    setSelectedFolder(
      previous.folder
    );

    setContentItems(
      previous.items || []
    );
  }

  /* =========================
     VIDEO
  ========================= */

  async function openVideo(item) {
    if (!selectedBatch) {
      return;
    }

    const contentId =
      getId(item);

    const courseId =
      getId(selectedBatch);

    if (
      !contentId ||
      !courseId
    ) {
      alert(
        'Video information is missing.'
      );

      return;
    }

    setPlayer({
      type: 'loading',
      title: getTitle(item),
    });

    try {
      const response =
        await fetch(
          `/api/playback?content_id=${encodeURIComponent(
            contentId
          )}&course_id=${encodeURIComponent(
            courseId
          )}`,
          {
            cache: 'no-store',
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            'Unable to load video.'
        );
      }

      if (!data.url) {
        throw new Error(
          'No playable video URL found.'
        );
      }

      setPlayer({
        type: 'video',
        title: getTitle(item),
        url: data.url,
      });
    } catch (error) {
      setPlayer({
        type: 'error',
        title: getTitle(item),
        error:
          error?.message ||
          'Unable to play video.',
      });
    }
  }

  /* =========================
     PDF
  ========================= */

  function openPdf(item) {
    const url =
      getPdfUrl(item);

    if (!url) {
      alert(
        'Is item ka PDF URL API response me available nahi hai.'
      );

      return;
    }

    setPlayer({
      type: 'pdf',
      title: getTitle(item),
      url,
    });
  }

  /* =========================
     TEST
  ========================= */

  async function openTest(item) {
    const testId =
      extractTestId(item) ||
      getId(selectedBatch);

    if (!testId) {
      setPlayer({
        type: 'error',
        title: getTitle(item),
        error:
          'Test ID API response me nahi mila.',
      });

      return;
    }

    setTestLoading(true);
    setTestError('');
    setTestInstructions(null);
    setTestData(null);
    setActiveTest(null);
    setTestResult(null);

    setPlayer({
      type: 'test-loading',
      title: getTitle(item),
    });

    try {
      const response =
        await fetch(
          `/api/test?test_instructions=${encodeURIComponent(
            testId
          )}`,
          {
            cache: 'no-store',
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            'Unable to load test instructions.'
        );
      }

      setTestInstructions(
        data.data
      );

      setPlayer({
        type: 'test-instructions',
        title: getTitle(item),
        testId,
      });
    } catch (error) {
      setTestError(
        error?.message ||
          'Unable to load test instructions.'
      );

      setPlayer({
        type: 'error',
        title: getTitle(item),
        error:
          error?.message ||
          'Unable to load test.',
      });
    } finally {
      setTestLoading(false);
    }
  }

  async function startTest(
    testId,
    title
  ) {
    setTestLoading(true);
    setTestError('');

    try {
      const response =
        await fetch(
          `/api/test?test_data=${encodeURIComponent(
            testId
          )}`,
          {
            cache: 'no-store',
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.error ||
            'Unable to load test questions.'
        );
      }

      const questions =
        normalizeQuestions(
          data.data
        );

      if (!questions.length) {
        throw new Error(
          'Test questions API me nahi mile.'
        );
      }

      setTestData(data.data);

      setActiveTest({
        id: testId,
        title,
        questions,
      });

      setTestAnswers({});
      setTestIndex(0);
      setTestResult(null);

      setPlayer({
        type: 'test',
        title,
      });
    } catch (error) {
      setTestError(
        error?.message ||
          'Unable to load test questions.'
      );

      setPlayer({
        type: 'error',
        title,
        error:
          error?.message ||
          'Unable to load test.',
      });
    } finally {
      setTestLoading(false);
    }
  }

  function normalizeQuestions(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (
      !data ||
      typeof data !== 'object'
    ) {
      return [];
    }

    const candidates = [
      data.questions,
      data.question,
      data.data,
      data.test?.questions,
      data.test_data,
      data.items,
    ];

    for (
      const candidate of candidates
    ) {
      if (Array.isArray(candidate)) {
        return candidate;
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
      'Question'
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
      return options;
    }

    if (
      options &&
      typeof options === 'object'
    ) {
      return Object.entries(
        options
      ).map(
        ([key, value]) => ({
          key,
          text:
            typeof value ===
            'object'
              ? value?.text ??
                value?.title ??
                value?.value ??
                ''
              : String(value),
        })
      );
    }

    return [];
  }

  function getOptionText(option) {
    if (
      typeof option ===
        'string' ||
      typeof option ===
        'number'
    ) {
      return String(option);
    }

    return (
      option?.text ??
      option?.title ??
      option?.label ??
      option?.value ??
      ''
    );
  }

  function getOptionKey(
    option,
    index
  ) {
    if (
      typeof option ===
        'string' ||
      typeof option ===
        'number'
    ) {
      return String(index);
    }

    return String(
      option?.id ??
        option?.key ??
        option?.value ??
        index
    );
  }

  function selectAnswer(
    questionIndex,
    value
  ) {
    setTestAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  }

  function calculateResult() {
    if (!activeTest) {
      return;
    }

    let correct = 0;
    let attempted = 0;

    activeTest.questions.forEach(
      (question, index) => {
        const answer =
          testAnswers[index];

        if (
          answer !== undefined &&
          answer !== null &&
          answer !== ''
        ) {
          attempted++;
        }

        const correctAnswer =
          question?.correct_answer ??
          question?.correctAnswer ??
          question?.answer ??
          question?.correct_option ??
          question?.data?.correct_answer;

        if (
          correctAnswer !==
            undefined &&
          String(answer) ===
            String(correctAnswer)
        ) {
          correct++;
        }
      }
    );

    setTestResult({
      total:
        activeTest.questions.length,
      attempted,
      correct,
    });

    setPlayer({
      type: 'test-result',
      title: activeTest.title,
    });
  }

  /* =========================
     ENROLL
  ========================= */

  function enroll(batch) {
    const batchId =
      getId(batch);

    setEnrolled((prev) => {
      if (
        prev.some(
          (item) =>
            getId(item) === batchId
        )
      ) {
        return prev;
      }

      return [
        ...prev,
        batch,
      ];
    });

    setEnrollBatch(null);
  }

  function isEnrolled(batch) {
    return enrolled.some(
      (item) =>
        getId(item) ===
        getId(batch)
    );
  }

  /* =========================
     FILTER
  ========================= */

  const filteredBatches =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return batches;
      }

      return batches.filter(
        (batch) => {
          const text = [
            batch?.title,
            batch?.description,
            batch?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return text.includes(q);
        }
      );
    }, [batches, search]);

  const folders =
    contentItems.filter(
      (item) => isFolder(item)
    );

  const files =
    contentItems.filter(
      (item) => !isFolder(item)
    );

  /* =========================
     NAVIGATION
  ========================= */

  function closePlayer() {
    setPlayer(null);
  }

  function goHome() {
    setPage('home');
    setSelectedBatch(null);
    setSelectedFolder(null);
    setFolderStack([]);
    setContentItems([]);
    setPlayer(null);
    setMenuOpen(false);
  }

  function goMyBatches() {
    setPage('my-batches');
    setMenuOpen(false);
  }

  function goBatches() {
    setPage('home');
    setMenuOpen(false);
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="pm-app">

      {/* HEADER */}

      <header className="pm-header">
        <button
          className="pm-brand"
          onClick={goHome}
          type="button"
        >
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
            className="pm-logo"
            decoding="async"
          />

          <span className="pm-brand-name">
            Prep Master
          </span>
        </button>

        <button
          className="pm-menu-btn"
          onClick={() =>
            setMenuOpen(
              !menuOpen
            )
          }
          type="button"
          aria-label="Menu"
        >
          ⋮
        </button>
      </header>

      {/* MENU */}

      {menuOpen && (
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
            <div className="pm-menu-title">
              Prep Master
            </div>

            <button
              onClick={goBatches}
              className="pm-menu-item"
            >
              📚 <span>Batches</span>
            </button>

            <button
              onClick={goMyBatches}
              className="pm-menu-item"
            >
              📖 <span>My Batches</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  TELEGRAM_URL,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              className="pm-menu-item"
            >
              ✈️ <span>Join Telegram</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  OWNER_URL,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              className="pm-menu-item"
            >
              👤 <span>Contact Owner</span>
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                setPage('admin');
              }}
              className="pm-menu-item"
            >
              ⚙️ <span>Admin Panel</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN */}

      <main className="pm-main">

        {/* HOME */}

        {page === 'home' && (
          <>
            <input
              className="pm-search"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search batches..."
            />

            <div className="pm-section-head">
              <h1 className="pm-section-title">
                Batches
              </h1>
            </div>

            {loadingBatches && (
              <div className="pm-loading-box">
                Loading batches...
              </div>
            )}

            {batchError && (
              <div className="pm-error-box">
                {batchError}
                <button
                  className="pm-retry"
                  onClick={
                    loadBatches
                  }
                >
                  Retry
                </button>
              </div>
            )}

            {!loadingBatches &&
              !batchError &&
              filteredBatches.length ===
                0 && (
                <div className="pm-empty-box">
                  No batches found.
                </div>
              )}

            <div className="pm-grid">
              {filteredBatches.map(
                (batch) => (
                  <div
                    className="pm-card"
                    key={getId(
                      batch
                    )}
                  >
                    {getBatchImage(
                      batch
                    ) ? (
                      <img
                        className="pm-card-image"
                        src={getBatchImage(
                          batch
                        )}
                        alt={
                          getTitle(
                            batch
                          )
                        }
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="pm-card-image pm-image-placeholder">
                        📚
                      </div>
                    )}

                    <div className="pm-card-body">
                      <h2 className="pm-card-title">
                        {getTitle(
                          batch
                        )}
                      </h2>

                      {getDescription(
                        batch
                      ) && (
                        <p className="pm-card-desc">
                          {getDescription(
                            batch
                          )}
                        </p>
                      )}

                      <div className="pm-price">
                        ₹
                        {getPrice(
                          batch
                        )}
                      </div>

                      <div className="pm-actions">
                        <button
                          className="pm-btn pm-btn-light"
                          onClick={() =>
                            openBatch(
                              batch
                            )
                          }
                        >
                          Study
                        </button>

                        {isEnrolled(
                          batch
                        ) ? (
                          <button
                            className="pm-btn pm-btn-primary"
                            onClick={() =>
                              openBatch(
                                batch
                              )
                            }
                          >
                            Open
                          </button>
                        ) : (
                          <button
                            className="pm-btn pm-btn-primary"
                            onClick={() =>
                              setEnrollBatch(
                                batch
                              )
                            }
                          >
                            Enroll
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* MY BATCHES */}

        {page === 'my-batches' && (
          <>
            <div className="pm-section-head">
              <h1 className="pm-section-title">
                My Batches
              </h1>

              <button
                className="pm-back"
                onClick={goHome}
              >
                ← Back
              </button>
            </div>

            {enrolled.length ===
              0 && (
              <div className="pm-empty-box">
                You haven't enrolled in
                any batch yet.
              </div>
            )}

            <div className="pm-grid">
              {enrolled.map(
                (batch) => (
                  <div
                    className="pm-card"
                    key={getId(
                      batch
                    )}
                  >
                    {getBatchImage(
                      batch
                    ) ? (
                      <img
                        className="pm-card-image"
                        src={getBatchImage(
                          batch
                        )}
                        alt={
                          getTitle(
                            batch
                          )
                        }
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="pm-card-image pm-image-placeholder">
                        📚
                      </div>
                    )}

                    <div className="pm-card-body">
                      <h2 className="pm-card-title">
                        {getTitle(
                          batch
                        )}
                      </h2>

                      <button
                        className="pm-btn pm-btn-primary pm-full-btn"
                        onClick={() =>
                          openBatch(
                            batch
                          )
                        }
                      >
                        Continue Study
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* CONTENT */}

        {page === 'content' && (
          <>
            <div className="pm-section-head">
              <div>
                <h1 className="pm-section-title">
                  {selectedFolder
                    ? getTitle(
                        selectedFolder
                      )
                    : getTitle(
                        selectedBatch
                      )}
                </h1>

                {selectedFolder && (
                  <div className="pm-breadcrumb">
                    {getTitle(
                      selectedBatch
                    )}{' '}
                    /{' '}
                    {getTitle(
                      selectedFolder
                    )}
                  </div>
                )}
              </div>

              <button
                className="pm-back"
                onClick={
                  selectedFolder
                    ? goBackFolder
                    : goHome
                }
              >
                ← Back
              </button>
            </div>

            {contentLoading && (
              <div className="pm-loading-box">
                Loading content...
              </div>
            )}

            {contentError && (
              <div className="pm-error-box">
                {contentError}

                <button
                  className="pm-retry"
                  onClick={() =>
                    loadContent(
                      getId(
                        selectedBatch
                      ),
                      selectedFolder
                        ? getId(
                            selectedFolder
                          )
                        : '0'
                    )
                  }
                >
                  Retry
                </button>
              </div>
            )}

            {!contentLoading &&
              !contentError &&
              contentItems.length ===
                0 && (
                <div className="pm-empty-box">
                  No content found.
                </div>
              )}

            {/* FOLDERS */}

            {folders.length > 0 && (
              <section>
                <h2 className="pm-subtitle">
                  Folders
                </h2>

                <div className="pm-content-grid">
                  {folders.map(
                    (folder) => (
                      <button
                        key={getId(
                          folder
                        )}
                        className="pm-content-card"
                        onClick={() =>
                          openFolder(
                            folder
                          )
                        }
                      >
                        <div className="pm-content-icon">
                          📁
                        </div>

                        <div className="pm-content-info">
                          <strong>
                            {getTitle(
                              folder
                            )}
                          </strong>

                          <span>
                            Open folder
                          </span>
                        </div>

                        <span className="pm-arrow">
                          →
                        </span>
                      </button>
                    )
                  )}
                </div>
              </section>
            )}

            {/* FILES */}

            {files.length > 0 && (
              <section>
                <h2 className="pm-subtitle">
                  Content
                </h2>

                <div className="pm-content-grid">
                  {files.map(
                    (item, index) => {
                      const video =
                        isVideo(
                          item
                        );

                      const pdf =
                        isPdf(
                          item
                        );

                      const test =
                        isTest(
                          item
                        );

                      let icon =
                        '📄';

                      let typeLabel =
                        'Content';

                      if (video) {
                        icon = '▶️';
                        typeLabel =
                          'Video';
                      } else if (pdf) {
                        icon = '📕';
                        typeLabel =
                          'PDF';
                      } else if (test) {
                        icon = '📝';
                        typeLabel =
                          'Test';
                      }

                      return (
                        <button
                          key={
                            getId(
                              item
                            ) ||
                            index
                          }
                          className="pm-content-card"
                          onClick={() => {
                            if (
                              video
                            ) {
                              openVideo(
                                item
                              );
                            } else if (
                              pdf
                            ) {
                              openPdf(
                                item
                              );
                            } else if (
                              test
                            ) {
                              openTest(
                                item
                              );
                            } else {
                              /*
                               * Better fallback:
                               * Some APIs don't expose
                               * the type clearly.
                               */
                              const possibleUrl =
                                item?.file_url ||
                                item?.data
                                  ?.file_url ||
                                item?.url ||
                                item?.data
                                  ?.url ||
                                '';

                              if (
                                /\.m3u8|\.mp4/i.test(
                                  possibleUrl
                                )
                              ) {
                                openVideo(
                                  item
                                );
                              } else if (
                                /\.pdf/i.test(
                                  possibleUrl
                                )
                              ) {
                                openPdf(
                                  item
                                );
                              } else {
                                setPlayer({
                                  type: 'unsupported',
                                  title:
                                    getTitle(
                                      item
                                    ),
                                  item,
                                });
                              }
                            }
                          }}
                        >
                          <div className="pm-content-icon">
                            {icon}
                          </div>

                          <div className="pm-content-info">
                            <strong>
                              {getTitle(
                                item
                              )}
                            </strong>

                            <span>
                              {typeLabel}
                            </span>
                          </div>

                          <span className="pm-arrow">
                            →
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* COMING SOON */}

        {page === 'community' && (
          <ComingSoon
            icon="💬"
            title="Community"
          />
        )}

        {page === 'ai' && (
          <ComingSoon
            icon="🤖"
            title="AI Doubts"
          />
        )}

        {/* ADMIN */}

        {page === 'admin' && (
          <ComingSoon
            icon="⚙️"
            title="Admin Panel"
          />
        )}
      </main>

      {/* BOTTOM NAV */}

      <nav className="pm-bottom-nav">

        <button
          className={
            page === 'community'
              ? 'pm-nav-active'
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
            page === 'my-batches'
              ? 'pm-nav-active'
              : ''
          }
          onClick={
            goMyBatches
          }
        >
          <span>📖</span>
          My Batches
        </button>

        <button
          className={
            page === 'home' ||
            page === 'content'
              ? 'pm-nav-main'
              : ''
          }
          onClick={goHome}
        >
          <span>📚</span>
          Batches
        </button>

        <button
          className={
            page === 'ai'
              ? 'pm-nav-active'
              : ''
          }
          onClick={() =>
            setPage('ai')
          }
        >
          <span>🤖</span>
          AI Doubts
        </button>

      </nav>

      {/* ENROLL POPUP */}

      {enrollBatch && (
        <div className="pm-modal-overlay">
          <div className="pm-enroll-modal">
            <div className="pm-success-icon">
              🎉
            </div>

            <h2>
              Congratulations 🎉
            </h2>

            <p>
              You have successfully
              enrolled in
              <strong>
                {' '}
                {getTitle(
                  enrollBatch
                )}
              </strong>
              .
            </p>

            <button
              className="pm-btn pm-btn-primary pm-full-btn"
              onClick={() =>
                enroll(
                  enrollBatch
                )
              }
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* PLAYER */}

      {player && (
        <div className="pm-player-overlay">
          <div className="pm-player">

            <div className="pm-player-header">
              <div className="pm-player-title">
                {player.title}
              </div>

              <button
                className="pm-close-btn"
                onClick={
                  closePlayer
                }
              >
                ✕
              </button>
            </div>

            {/* LOADING */}

            {player.type ===
              'loading' && (
              <div className="pm-player-center">
                <div className="pm-spinner" />
                <p>
                  Loading video...
                </p>
              </div>
            )}

            {/* VIDEO */}

            {player.type ===
              'video' && (
              <div className="pm-video-wrap">
                <video
                  className="pm-video"
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  src={player.url}
                />
              </div>
            )}

            {/* PDF */}

            {player.type ===
              'pdf' && (
              <div className="pm-pdf-wrap">
                <iframe
                  src={player.url}
                  title={
                    player.title
                  }
                  className="pm-pdf"
                />
              </div>
            )}

            {/* TEST LOADING */}

            {player.type ===
              'test-loading' && (
              <div className="pm-player-center">
                <div className="pm-spinner" />
                <p>
                  Loading test...
                </p>
              </div>
            )}

            {/* TEST INSTRUCTIONS */}

            {player.type ===
              'test-instructions' && (
              <div className="pm-test-box">

                <h2>
                  {player.title}
                </h2>

                <div className="pm-test-instructions">
                  {renderInstructions(
                    testInstructions
                  )}
                </div>

                {testError && (
                  <div className="pm-test-error">
                    {testError}
                  </div>
                )}

                <button
                  className="pm-btn pm-btn-primary pm-full-btn"
                  disabled={
                    testLoading
                  }
                  onClick={() =>
                    startTest(
                      player.testId,
                      player.title
                    )
                  }
                >
                  {testLoading
                    ? 'Loading...'
                    : 'Start Test'}
                </button>
              </div>
            )}

            {/* TEST */}

            {player.type ===
              'test' &&
              activeTest && (
                <div className="pm-test-box">

                  <div className="pm-test-progress">
                    Question{' '}
                    {testIndex + 1}{' '}
                    of{' '}
                    {
                      activeTest
                        .questions
                        .length
                    }
                  </div>

                  {(() => {
                    const question =
                      activeTest
                        .questions[
                        testIndex
                      ];

                    const options =
                      getOptions(
                        question
                      );

                    return (
                      <>
                        <h2 className="pm-question">
                          {getQuestionText(
                            question
                          )}
                        </h2>

                        <div className="pm-options">
                          {options.map(
                            (
                              option,
                              optionIndex
                            ) => {
                              const key =
                                getOptionKey(
                                  option,
                                  optionIndex
                                );

                              const selected =
                                String(
                                  testAnswers[
                                    testIndex
                                  ]
                                ) ===
                                String(
                                  key
                                );

                              return (
                                <button
                                  key={
                                    key
                                  }
                                  className={
                                    selected
                                      ? 'pm-option pm-option-selected'
                                      : 'pm-option'
                                  }
                                  onClick={() =>
                                    selectAnswer(
                                      testIndex,
                                      key
                                    )
                                  }
                                >
                                  <span className="pm-option-letter">
                                    {String.fromCharCode(
                                      65 +
                                        optionIndex
                                    )}
                                  </span>

                                  <span>
                                    {getOptionText(
                                      option
                                    )}
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>

                        <div className="pm-test-buttons">

                          {testIndex >
                            0 && (
                            <button
                              className="pm-btn pm-btn-light"
                              onClick={() =>
                                setTestIndex(
                                  (
                                    prev
                                  ) =>
                                    prev -
                                    1
                                )
                              }
                            >
                              ← Previous
                            </button>
                          )}

                          {testIndex <
                          activeTest
                            .questions
                            .length -
                            1 ? (
                            <button
                              className="pm-btn pm-btn-primary"
                              onClick={() =>
                                setTestIndex(
                                  (
                                    prev
                                  ) =>
                                    prev +
                                    1
                                )
                              }
                            >
                              Next →
                            </button>
                          ) : (
                            <button
                              className="pm-btn pm-btn-primary"
                              onClick={
                                calculateResult
                              }
                            >
                              Submit Test
                            </button>
                          )}

                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

            {/* TEST RESULT */}

            {player.type ===
              'test-result' &&
              testResult && (
                <div className="pm-test-result">

                  <div className="pm-result-icon">
                    🎉
                  </div>

                  <h2>
                    Test Completed
                  </h2>

                  <div className="pm-result-grid">
                    <div>
                      <strong>
                        {
                          testResult.total
                        }
                      </strong>
                      <span>
                        Total
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          testResult.attempted
                        }
                      </strong>
                      <span>
                        Attempted
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          testResult.correct
                        }
                      </strong>
                      <span>
                        Correct
                      </span>
                    </div>
                  </div>

                  <button
                    className="pm-btn pm-btn-primary pm-full-btn"
                    onClick={
                      closePlayer
                    }
                  >
                    Done
                  </button>

                </div>
              )}

            {/* ERROR */}

            {player.type ===
              'error' && (
              <div className="pm-player-center">
                <div className="pm-error-icon">
                  ⚠️
                </div>

                <h2>
                  Something went wrong
                </h2>

                <p>
                  {player.error}
                </p>

                <button
                  className="pm-btn pm-btn-primary"
                  onClick={
                    closePlayer
                  }
                >
                  Close
                </button>
              </div>
            )}

            {/* UNSUPPORTED */}

            {player.type ===
              'unsupported' && (
              <div className="pm-player-center pm-unsupported">

                <div className="pm-error-icon">
                  📄
                </div>

                <h2>
                  Content viewer
                </h2>

                <p>
                  Is content ka direct
                  viewer abhi available
                  nahi hai.
                </p>

                <details>
                  <summary>
                    Content details
                  </summary>

                  <pre>
                    {JSON.stringify(
                      player.item,
                      null,
                      2
                    )}
                  </pre>
                </details>

                <button
                  className="pm-btn pm-btn-primary"
                  onClick={
                    closePlayer
                  }
                >
                  Close
                </button>

              </div>
            )}

          </div>
        </div>
      )}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #111827;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        body {
          min-height: 100vh;
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
          background: #ffffff;
        }

        .pm-header {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          background: rgba(
            255,
            255,
            255,
            0.96
          );
          border-bottom: 1px solid
            #edf1f6;
          backdrop-filter: blur(12px);
        }

        .pm-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 0;
          background: transparent;
          padding: 0;
          color: #111827;
        }

        .pm-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
          border-radius: 12px;
        }

        .pm-brand-name {
          font-size: 19px;
          font-weight: 800;
        }

        .pm-menu-btn {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 12px;
          background: #f3f6fa;
          color: #111827;
          font-size: 25px;
          line-height: 1;
        }

        .pm-main {
          max-width: 1180px;
          margin: 0 auto;
          padding: 20px 16px 110px;
        }

        .pm-search {
          width: 100%;
          height: 48px;
          border: 1px solid
            #e5eaf1;
          border-radius: 15px;
          padding: 0 16px;
          outline: none;
          background: #f8fafc;
          margin-bottom: 18px;
        }

        .pm-search:focus {
          border-color: #2563eb;
          background: #ffffff;
        }

        .pm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 18px 0 14px;
        }

        .pm-section-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
        }

        .pm-subtitle {
          margin: 24px 0 12px;
          font-size: 18px;
          font-weight: 800;
        }

        .pm-breadcrumb {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
        }

        .pm-back {
          border: 0;
          background: #eff6ff;
          color: #2563eb;
          padding: 9px 13px;
          border-radius: 10px;
          font-weight: 700;
        }

        .pm-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fill,
              minmax(270px, 1fr)
            );
          gap: 16px;
        }

        .pm-card {
          overflow: hidden;
          border: 1px solid
            #e8edf3;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 5px 18px
              rgba(
                15,
                23,
                42,
                0.05
              );
        }

        .pm-card-image {
          width: 100%;
          height: 155px;
          display: block;
          object-fit: cover;
          background: #eef2f7;
        }

        .pm-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }

        .pm-card-body {
          padding: 14px;
        }

        .pm-card-title {
          margin: 0;
          font-size: 16px;
          line-height: 1.4;
          font-weight: 800;
        }

        .pm-card-desc {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pm-price {
          margin-top: 10px;
          font-size: 16px;
          font-weight: 800;
          color: #2563eb;
        }

        .pm-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 13px;
        }

        .pm-btn {
          min-height: 42px;
          border: 0;
          border-radius: 11px;
          padding: 0 13px;
          font-weight: 750;
        }

        .pm-btn-primary {
          color: #ffffff;
          background: #2563eb;
        }

        .pm-btn-light {
          color: #1e3a8a;
          background: #eff6ff;
        }

        .pm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pm-full-btn {
          width: 100%;
          margin-top: 12px;
        }

        .pm-loading-box,
        .pm-empty-box,
        .pm-error-box {
          padding: 25px 16px;
          border-radius: 15px;
          background: #f8fafc;
          text-align: center;
          color: #64748b;
        }

        .pm-error-box {
          color: #b91c1c;
          background: #fef2f2;
        }

        .pm-retry {
          margin-left: 10px;
          border: 0;
          border-radius: 9px;
          padding: 8px 12px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
        }

        .pm-content-grid {
          display: grid;
          gap: 10px;
        }

        .pm-content-card {
          width: 100%;
          min-height: 70px;
          display: flex;
          align-items: center;
          gap: 13px;
          border: 1px solid
            #e8edf3;
          border-radius: 15px;
          padding: 11px 13px;
          background: #ffffff;
          text-align: left;
          box-shadow:
            0 3px 12px
              rgba(
                15,
                23,
                42,
                0.035
              );
        }

        .pm-content-card:hover {
          border-color: #bfdbfe;
          background: #f8fbff;
        }

        .pm-content-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eff6ff;
          font-size: 22px;
        }

        .pm-content-info {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pm-content-info strong {
          color: #111827;
          font-size: 14px;
          line-height: 1.35;
        }

        .pm-content-info span {
          color: #64748b;
          font-size: 12px;
        }

        .pm-arrow {
          color: #94a3b8;
          font-size: 20px;
        }

        .pm-bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 40;
          height: 70px;
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          background: rgba(
            255,
            255,
            255,
            0.97
          );
          border-top: 1px solid
            #e8edf3;
          backdrop-filter: blur(12px);
          padding-bottom: env(
            safe-area-inset-bottom
          );
        }

        .pm-bottom-nav button {
          border: 0;
          background: transparent;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 3px;
          font-size: 11px;
          font-weight: 650;
        }

        .pm-bottom-nav button span {
          font-size: 20px;
        }

        .pm-bottom-nav
          .pm-nav-active {
          color: #2563eb;
        }

        .pm-bottom-nav
          .pm-nav-main {
          color: #2563eb;
          font-weight: 800;
        }

        .pm-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(
            15,
            23,
            42,
            0.18
          );
        }

        .pm-menu {
          position: absolute;
          top: 76px;
          right: 14px;
          width: min(
            280px,
            calc(100vw - 28px)
          );
          padding: 10px;
          border: 1px solid
            #e5eaf1;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 18px 50px
              rgba(
                15,
                23,
                42,
                0.16
              );
        }

        .pm-menu-title {
          padding: 11px 12px;
          font-weight: 800;
          border-bottom: 1px solid
            #eef2f7;
          margin-bottom: 5px;
        }

        .pm-menu-item {
          width: 100%;
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 0;
          border-radius: 11px;
          background: transparent;
          padding: 0 12px;
          color: #111827;
          text-align: left;
          font-weight: 650;
        }

        .pm-menu-item:hover {
          background: #f8fafc;
        }

        .pm-modal-overlay,
        .pm-player-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(
            15,
            23,
            42,
            0.6
          );
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .pm-enroll-modal {
          width: min(
            410px,
            100%
          );
          border-radius: 22px;
          padding: 28px;
          background: #ffffff;
          text-align: center;
          box-shadow:
            0 25px 70px
              rgba(
                15,
                23,
                42,
                0.25
              );
        }

        .pm-success-icon {
          font-size: 52px;
        }

        .pm-enroll-modal h2 {
          margin: 12px 0 8px;
        }

        .pm-enroll-modal p {
          color: #64748b;
          line-height: 1.5;
        }

        .pm-player {
          width: min(
            1100px,
            100%
          );
          max-height: 94vh;
          overflow: hidden;
          border-radius: 18px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }

        .pm-player-header {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 15px;
          border-bottom: 1px solid
            #e8edf3;
        }

        .pm-player-title {
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pm-close-btn {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border: 0;
          border-radius: 10px;
          background: #f1f5f9;
          font-size: 16px;
        }

        .pm-video-wrap {
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pm-video {
          width: 100%;
          max-height: 75vh;
          display: block;
          background: #000000;
        }

        .pm-pdf-wrap {
          height: 78vh;
          background: #f1f5f9;
        }

        .pm-pdf {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .pm-player-center {
          min-height: 300px;
          padding: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          gap: 10px;
        }

        .pm-player-center p {
          margin: 0;
          color: #64748b;
        }

        .pm-spinner {
          width: 42px;
          height: 42px;
          border: 4px solid
            #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation:
            pm-spin 0.8s linear infinite;
        }

        @keyframes pm-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .pm-error-icon,
        .pm-result-icon {
          font-size: 45px;
        }

        .pm-test-box {
          overflow-y: auto;
          padding: 25px;
        }

        .pm-test-box h2 {
          margin-top: 0;
        }

        .pm-test-instructions {
          padding: 15px;
          margin-bottom: 16px;
          border-radius: 12px;
          background: #f8fafc;
          line-height: 1.6;
        }

        .pm-test-error {
          margin: 10px 0;
          padding: 10px;
          border-radius: 9px;
          color: #b91c1c;
          background: #fef2f2;
        }

        .pm-test-progress {
          margin-bottom: 14px;
          color: #2563eb;
          font-weight: 750;
        }

        .pm-question {
          line-height: 1.5;
        }

        .pm-options {
          display: grid;
          gap: 10px;
          margin: 20px 0;
        }

        .pm-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 52px;
          border: 1px solid
            #e2e8f0;
          border-radius: 12px;
          padding: 8px 12px;
          background: #ffffff;
          text-align: left;
        }

        .pm-option-selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .pm-option-letter {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f1f5f9;
          font-weight: 800;
        }

        .pm-test-buttons {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
        }

        .pm-result-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
          margin: 20px 0;
        }

        .pm-result-grid div {
          padding: 18px 8px;
          border-radius: 13px;
          background: #f8fafc;
          text-align: center;
        }

        .pm-result-grid strong,
        .pm-result-grid span {
          display: block;
        }

        .pm-result-grid strong {
          font-size: 25px;
          color: #2563eb;
        }

        .pm-result-grid span {
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
        }

        .pm-test-result {
          padding: 35px;
          text-align: center;
          overflow-y: auto;
        }

        .pm-unsupported {
          overflow-y: auto;
        }

        .pm-unsupported details {
          width: 100%;
          max-width: 700px;
          text-align: left;
        }

        .pm-unsupported pre {
          max-height: 250px;
          overflow: auto;
          padding: 12px;
          border-radius: 10px;
          background: #f8fafc;
          font-size: 11px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 600px) {

          .pm-header {
            height: 62px;
            padding: 0 13px;
          }

          .pm-logo {
            width: 36px;
            height: 36px;
          }

          .pm-brand-name {
            font-size: 17px;
          }

          .pm-main {
            padding: 15px 12px 100px;
          }

          .pm-grid {
            grid-template-columns: 1fr;
          }

          .pm-card-image {
            height: 170px;
          }

          .pm-player-overlay {
            padding: 0;
          }

          .pm-player {
            width: 100%;
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }

          .pm-video {
            max-height: 65vh;
          }

          .pm-pdf-wrap {
            height: calc(
              100vh - 58px
            );
          }

          .pm-test-box {
            padding: 18px;
          }

          .pm-result-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }
        }

      `}</style>
    </div>
  );
}

/* =========================
   COMING SOON
========================= */

function ComingSoon({
  icon,
  title,
}) {
  return (
    <div className="pm-coming-soon">
      <div className="pm-coming-icon">
        {icon}
      </div>

      <h1>{title}</h1>

      <p>
        This feature is coming soon.
      </p>

      <style jsx>{`
        .pm-coming-soon {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
        }

        .pm-coming-icon {
          font-size: 55px;
          margin-bottom: 10px;
        }

        .pm-coming-soon h1 {
          margin: 0;
          font-size: 25px;
        }

        .pm-coming-soon p {
          color: #64748b;
        }
      `}</style>
    </div>
  );
}

/* =========================
   TEST INSTRUCTIONS
========================= */

function renderInstructions(data) {
  if (
    data === null ||
    data === undefined
  ) {
    return (
      <p>
        No instructions available.
      </p>
    );
  }

  if (
    typeof data === 'string' ||
    typeof data === 'number'
  ) {
    return (
      <p>
        {String(data)}
      </p>
    );
  }

  if (Array.isArray(data)) {
    return (
      <ul>
        {data.map(
          (item, index) => (
            <li key={index}>
              {typeof item ===
              'object'
                ? JSON.stringify(
                    item
                  )
                : String(item)}
            </li>
          )
        )}
      </ul>
    );
  }

  const possibleText =
    data?.instructions ??
    data?.instruction ??
    data?.description ??
    data?.text ??
    data?.data?.instructions ??
    data?.data?.description;

  if (possibleText) {
    return (
      <p>
        {String(
          possibleText
        )}
      </p>
    );
  }

  return (
    <pre
      style={{
        whiteSpace:
          'pre-wrap',
        wordBreak:
          'break-word',
        margin: 0,
      }}
    >
      {JSON.stringify(
        data,
        null,
        2
      )}
    </pre>
  );
}
