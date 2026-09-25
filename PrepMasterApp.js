'use client';

import { useEffect, useMemo, useState } from 'react';

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/prepmaster0';

const OWNER_URL =
  process.env.NEXT_PUBLIC_OWNER_CONTACT || 'https://t.me/Subhanali011';

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
  const type = getFileType(item);

  const url =
    item?.file_url ||
    item?.data?.file_url ||
    item?.pdf_url ||
    item?.data?.pdf_url ||
    '';

  return (
    type === 3 ||
    item?.has_pdf === 1 ||
    item?.has_pdf === '1' ||
    Boolean(item?.pdf_url) ||
    Boolean(item?.data?.pdf_url) ||
    /\.pdf(\?|$)/i.test(url)
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

export default function PrepMasterApp() {
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [batchError, setBatchError] = useState('');

  const [page, setPage] = useState('home');
  const [search, setSearch] = useState('');

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [contentItems, setContentItems] = useState([]);
  const [folderStack, setFolderStack] = useState([]);

  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');

  const [player, setPlayer] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [enrollBatch, setEnrollBatch] = useState(null);

  const [enrolled, setEnrolled] = useState([]);

  const [testInstructions, setTestInstructions] = useState(null);
  const [testData, setTestData] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  const [activeTest, setActiveTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testIndex, setTestIndex] = useState(0);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadBatches();

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

  async function loadBatches() {
    setLoadingBatches(true);
    setBatchError('');

    try {
      const response = await fetch('/api/batches', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || 'Unable to load batches.'
        );
      }

      setBatches(
        Array.isArray(data.batches)
          ? data.batches
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

  async function loadContent(courseId, folderId = '0') {
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

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || 'Unable to load content.'
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
        error?.message || 'Unable to load content.'
      );
    } finally {
      setContentLoading(false);
    }
  }

  async function openBatch(batch) {
    setSelectedBatch(batch);
    setSelectedFolder(null);
    setFolderStack([]);
    setPage('content');

    await loadContent(getId(batch), '0');
  }

  async function openFolder(folder) {
    const folderId = getId(folder);

    if (!folderId || !selectedBatch) {
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

  async function goBackFolder() {
    if (!selectedBatch) return;

    if (folderStack.length === 0) {
      setSelectedFolder(null);
      await loadContent(
        getId(selectedBatch),
        '0'
      );
      return;
    }

    const previous =
      folderStack[folderStack.length - 1];

    setFolderStack((prev) =>
      prev.slice(0, -1)
    );

    setSelectedFolder(previous.folder);
    setContentItems(previous.items || []);
  }

  async function openVideo(item) {
    if (!selectedBatch) return;

    const contentId = getId(item);
    const courseId = getId(selectedBatch);

    if (!contentId || !courseId) {
      alert('Video information is missing.');
      return;
    }

    setPlayer({
      type: 'loading',
      title: getTitle(item),
    });

    try {
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

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || 'Unable to load video.'
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

  function openPdf(item) {
    const url = getPdfUrl(item);

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

  async function openTest(item) {
    const testId =
      extractTestId(item) ||
      getId(selectedBatch);

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
      const instructionResponse =
        await fetch(
          `/api/test?test_instructions=${encodeURIComponent(
            testId
          )}`,
          {
            cache: 'no-store',
          }
        );

      const instructionJson =
        await instructionResponse.json();

      if (
        !instructionResponse.ok ||
        !instructionJson?.success
      ) {
        throw new Error(
          instructionJson?.error ||
            'Unable to load test instructions.'
        );
      }

      setTestInstructions(
        instructionJson.data
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

  async function startTest(testId, title) {
    setTestLoading(true);
    setTestError('');

    try {
      const response = await fetch(
        `/api/test?test_data=${encodeURIComponent(
          testId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
            'Unable to load test questions.'
        );
      }

      const questions = normalizeQuestions(
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

    if (!data || typeof data !== 'object') {
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

    for (const candidate of candidates) {
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
      return Object.entries(options).map(
        ([key, value]) => ({
          key,
          text:
            typeof value === 'object'
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
      typeof option === 'string' ||
      typeof option === 'number'
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

  function getOptionKey(option, index) {
    if (
      typeof option === 'string' ||
      typeof option === 'number'
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

  function selectAnswer(questionIndex, value) {
    setTestAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  }

  function calculateResult() {
    if (!activeTest) return;

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
          correctAnswer !== undefined &&
          String(answer) ===
            String(correctAnswer)
        ) {
          correct++;
        }
      }
    );

    setTestResult({
      total: activeTest.questions.length,
      attempted,
      correct,
    });

    setPlayer({
      type: 'test-result',
      title: activeTest.title,
    });
  }

  function enroll(batch) {
    const batchId = getId(batch);

    setEnrolled((prev) => {
      if (
        prev.some(
          (item) => getId(item) === batchId
        )
      ) {
        return prev;
      }

      return [...prev, batch];
    });

    setEnrollBatch(null);
  }

  function isEnrolled(batch) {
    return enrolled.some(
      (item) =>
        getId(item) === getId(batch)
    );
  }

  const filteredBatches = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return batches;

    return batches.filter((batch) => {
      const text = [
        batch?.title,
        batch?.description,
        batch?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(q);
    });
  }, [batches, search]);

  const folders = contentItems.filter(
    (item) => isFolder(item)
  );

  const files = contentItems.filter(
    (item) => !isFolder(item)
  );

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

  return (
    <div className="pm-app">
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
          z-index: 30;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid #eef2f7;
          backdrop-filter: blur(14px);
        }

        .pm-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
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
          white-space: nowrap;
        }

        .pm-menu-btn {
          width: 42px;
          height: 42px;
          border: 0;
          background: #f3f6fa;
          border-radius: 12px;
          font-size: 24px;
        }

        .pm-main {
          max-width: 1180px;
          margin: 0 auto;
          padding: 20px 16px 105px;
        }

        .pm-search {
          width: 100%;
          height: 48px;
          border: 1px solid #e5eaf1;
          border-radius: 15px;
          padding: 0 16px;
          outline: none;
          background: #f8fafc;
          margin-bottom: 20px;
        }

        .pm-search:focus {
          border-color: #2563eb;
          background: #fff;
        }

        .pm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 20px 0 12px;
        }

        .pm-section-title {
          margin: 0;
          font-size: 21px;
          font-weight: 800;
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
          grid-template-columns: repeat(
            auto-fill,
            minmax(270px, 1fr)
          );
          gap: 16px;
        }

        .pm-card {
          overflow: hidden;
          border: 1px solid #e9edf3;
          border-radius: 18px;
          background: #fff;
          box-shadow:
            0 5px 18px rgba(15, 23, 42, 0.05);
        }

        .pm-card-image {
          width: 100%;
          height: 155px;
          object-fit: cover;
          display: block;
          background: #eef2f7;
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
          font-weight: 750;
          padding: 0 12px;
        }

        .pm-btn-primary {
          color: white;
          background: #2563eb;
        }

        .pm-btn-light {
          color: #1e3a8a;
          background: #eff6ff;
        }

        .pm-btn-danger {
          color: #b91c1c;
          background: #fef2f2;
        }

        .pm-empty,
        .pm-error,
        .pm-loading {
          padding: 35px 15px;
          text-align: center;
          color: #64748b;
        }

        .pm-error {
          color: #b91c1c;
        }

        .pm-folder-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(210px, 1fr)
          );
          gap: 12px;
        }

        .pm-folder {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          text-align: left;
          padding: 15px;
          border: 1px solid #e7edf5;
          background: white;
          border-radius: 15px;
          box-shadow:
            0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .pm-folder-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eff6ff;
          font-size: 21px;
          flex: 0 0 auto;
        }

        .pm-folder-name {
          font-weight: 750;
          line-height: 1.35;
        }

        .pm-file-list {
          display: grid;
          gap: 10px;
        }

        .pm-file {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid #e8edf3;
          border-radius: 14px;
          background: #fff;
          text-align: left;
        }

        .pm-file-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #f1f5f9;
          font-size: 20px;
          flex: 0 0 auto;
        }

        .pm-file-title {
          font-weight: 700;
          line-height: 1.35;
        }

        .pm-file-type {
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
        }

        .pm-bottom {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 35;
          height: 72px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(255, 255, 255, 0.97);
          border-top: 1px solid #e8edf3;
          backdrop-filter: blur(14px);
        }

        .pm-nav {
          border: 0;
          background: transparent;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .pm-nav-icon {
          display: block;
          font-size: 21px;
          margin-bottom: 2px;
        }

        .pm-nav.active {
          color: #2563eb;
        }

        .pm-menu-overlay,
        .pm-modal-overlay,
        .pm-player-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.45);
        }

        .pm-menu-panel {
          position: absolute;
          top: 76px;
          right: 14px;
          width: 250px;
          padding: 8px;
          border-radius: 17px;
          background: #fff;
          box-shadow:
            0 20px 60px rgba(15, 23, 42, 0.2);
        }

        .pm-menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 0;
          background: transparent;
          border-radius: 11px;
          text-align: left;
          font-weight: 650;
        }

        .pm-menu-item:hover {
          background: #f5f8fc;
        }

        .pm-modal-wrap {
          min-height: 100%;
          display: grid;
          place-items: center;
          padding: 18px;
        }

        .pm-modal {
          width: min(430px, 100%);
          padding: 22px;
          border-radius: 20px;
          background: #fff;
          box-shadow:
            0 25px 80px rgba(15, 23, 42, 0.25);
        }

        .pm-modal h3 {
          margin: 0 0 8px;
          font-size: 22px;
        }

        .pm-modal p {
          color: #64748b;
          line-height: 1.5;
        }

        .pm-modal-actions {
          display: grid;
          gap: 9px;
          margin-top: 18px;
        }

        .pm-player-overlay {
          z-index: 200;
          background: #000;
        }

        .pm-player {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #fff;
        }

        .pm-player-head {
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: #111827;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }

        .pm-player-back {
          border: 0;
          background: #f1f5f9;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          font-size: 20px;
        }

        .pm-player-title {
          font-weight: 800;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pm-video-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }

        .pm-video {
          width: 100%;
          height: auto;
          max-height: calc(100vh - 58px);
          background: #000;
        }

        .pm-pdf-area {
          flex: 1;
          background: #e5e7eb;
        }

        .pm-pdf {
          width: 100%;
          height: 100%;
          min-height: calc(100vh - 58px);
          border: 0;
          background: #fff;
        }

        .pm-test-area {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          background: #f8fafc;
        }

        .pm-test-card {
          width: min(760px, 100%);
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 20px;
        }

        .pm-test-option {
          width: 100%;
          padding: 13px;
          margin-top: 9px;
          text-align: left;
          border: 1px solid #dbe2ea;
          border-radius: 11px;
          background: #fff;
        }

        .pm-test-option.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .pm-test-actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 20px;
        }

        @media (max-width: 600px) {
          .pm-main {
            padding-left: 12px;
            padding-right: 12px;
          }

          .pm-grid {
            grid-template-columns: 1fr;
          }

          .pm-folder-grid {
            grid-template-columns: 1fr;
          }

          .pm-card-image {
            height: 175px;
          }
        }
      `}</style>

      <header className="pm-header">
        <button
          className="pm-brand"
          onClick={goHome}
          style={{
            border: 0,
            background: 'transparent',
            padding: 0,
          }}
        >
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
            className="pm-logo"
            onError={(event) => {
              event.currentTarget.style.display =
                'none';
            }}
          />

          <span className="pm-brand-name">
            Prep Master
          </span>
        </button>

        <button
          className="pm-menu-btn"
          onClick={() =>
            setMenuOpen((value) => !value)
          }
          aria-label="Menu"
        >
          ⋮
        </button>
      </header>

      {menuOpen && (
        <div
          className="pm-menu-overlay"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="pm-menu-panel"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="pm-menu-item"
              onClick={() => {
                setPage('home');
                setMenuOpen(false);
              }}
            >
              📚 <span>Batches</span>
            </button>

            <button
              className="pm-menu-item"
              onClick={goMyBatches}
            >
              📖 <span>My Batches</span>
            </button>

            <button
              className="pm-menu-item"
              onClick={() =>
                window.open(
                  TELEGRAM_URL,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              ✈️ <span>Join Telegram</span>
            </button>

            <button
              className="pm-menu-item"
              onClick={() =>
                window.open(
                  OWNER_URL,
                  '_blank',
                  'noopener,noreferrer'
                )
              }
            >
              👤 <span>Contact Owner</span>
            </button>

            <button
              className="pm-menu-item"
              onClick={() => {
                alert(
                  'Admin Panel feature is coming soon.'
                );
                setMenuOpen(false);
              }}
            >
              ⚙️ <span>Admin Panel</span>
            </button>
          </div>
        </div>
      )}

      <main className="pm-main">
        {page === 'home' && (
          <>
            <input
              className="pm-search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search batches..."
            />

            <div className="pm-section-head">
              <h2 className="pm-section-title">
                Batches
              </h2>

              <button
                className="pm-back"
                onClick={loadBatches}
              >
                ↻ Refresh
              </button>
            </div>

            {loadingBatches && (
              <div className="pm-loading">
                Loading batches...
              </div>
            )}

            {batchError && (
              <div className="pm-error">
                {batchError}
              </div>
            )}

            {!loadingBatches &&
              !batchError &&
              filteredBatches.length === 0 && (
                <div className="pm-empty">
                  No batches found.
                </div>
              )}

            <div className="pm-grid">
              {filteredBatches.map((batch) => (
                <article
                  className="pm-card"
                  key={getId(batch)}
                >
                  {getBatchImage(batch) ? (
                    <img
                      className="pm-card-image"
                      src={getBatchImage(batch)}
                      alt={batch?.title || 'Batch'}
                    />
                  ) : (
                    <div className="pm-card-image" />
                  )}

                  <div className="pm-card-body">
                    <h3 className="pm-card-title">
                      {batch?.title ||
                        batch?.name ||
                        'Untitled Batch'}
                    </h3>

                    {getDescription(batch) && (
                      <p className="pm-card-desc">
                        {getDescription(batch)}
                      </p>
                    )}

                    <div className="pm-price">
                      ₹{getPrice(batch)}
                    </div>

                    <div className="pm-actions">
                      <button
                        className="pm-btn pm-btn-light"
                        onClick={() =>
                          openBatch(batch)
                        }
                      >
                        Study
                      </button>

                      <button
                        className="pm-btn pm-btn-primary"
                        onClick={() => {
                          if (
                            isEnrolled(batch)
                          ) {
                            openBatch(batch);
                          } else {
                            setEnrollBatch(batch);
                          }
                        }}
                      >
                        {isEnrolled(batch)
                          ? 'Open'
                          : 'Enroll'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {page === 'my-batches' && (
          <>
            <div className="pm-section-head">
              <h2 className="pm-section-title">
                My Batches
              </h2>

              <button
                className="pm-back"
                onClick={goHome}
              >
                ← Batches
              </button>
            </div>

            {enrolled.length === 0 ? (
              <div className="pm-empty">
                Abhi koi batch enrolled nahi hai.
              </div>
            ) : (
              <div className="pm-grid">
                {enrolled.map((batch) => (
                  <article
                    className="pm-card"
                    key={getId(batch)}
                  >
                    {getBatchImage(batch) ? (
                      <img
                        className="pm-card-image"
                        src={getBatchImage(batch)}
                        alt={batch?.title || 'Batch'}
                      />
                    ) : (
                      <div className="pm-card-image" />
                    )}

                    <div className="pm-card-body">
                      <h3 className="pm-card-title">
                        {batch?.title ||
                          batch?.name ||
                          'Untitled Batch'}
                      </h3>

                      <div className="pm-actions">
                        <button
                          className="pm-btn pm-btn-primary"
                          onClick={() =>
                            openBatch(batch)
                          }
                        >
                          Study
                        </button>

                        <button
                          className="pm-btn pm-btn-light"
                          onClick={() => {
                            setEnrolled((prev) =>
                              prev.filter(
                                (item) =>
                                  getId(item) !==
                                  getId(batch)
                              )
                            );
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {page === 'content' && (
          <>
            <div className="pm-section-head">
              <div>
                <h2 className="pm-section-title">
                  {selectedFolder
                    ? getTitle(selectedFolder)
                    : selectedBatch?.title ||
                      'Batch'}
                </h2>
              </div>

              <button
                className="pm-back"
                onClick={() => {
                  if (selectedFolder) {
                    goBackFolder();
                  } else {
                    goHome();
                  }
                }}
              >
                ← Back
              </button>
            </div>

            {contentLoading && (
              <div className="pm-loading">
                Loading content...
              </div>
            )}

            {contentError && (
              <div className="pm-error">
                {contentError}
              </div>
            )}

            {!contentLoading &&
              !contentError &&
              contentItems.length === 0 && (
                <div className="pm-empty">
                  No content found.
                </div>
              )}

            {folders.length > 0 && (
              <>
                <div className="pm-section-head">
                  <h3 className="pm-section-title">
                    Folders
                  </h3>
                </div>

                <div className="pm-folder-grid">
                  {folders.map((folder) => (
                    <button
                      className="pm-folder"
                      key={getId(folder)}
                      onClick={() =>
                        openFolder(folder)
                      }
                    >
                      <span className="pm-folder-icon">
                        📁
                      </span>

                      <span className="pm-folder-name">
                        {getTitle(folder)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {files.length > 0 && (
              <>
                <div className="pm-section-head">
                  <h3 className="pm-section-title">
                    Content
                  </h3>
                </div>

                <div className="pm-file-list">
                  {files.map((item) => {
                    const video =
                      isVideo(item);

                    const pdf =
                      isPdf(item);

                    const test =
                      isTest(item);

                    let icon = '📄';
                    let type = 'Material';

                    if (video) {
                      icon = '🎥';
                      type = 'Video';
                    } else if (pdf) {
                      icon = '📄';
                      type = 'PDF / Notes';
                    } else if (test) {
                      icon = '📝';
                      type = 'Test';
                    }

                    return (
                      <button
                        className="pm-file"
                        key={`${getId(item)}-${getTitle(
                          item
                        )}`}
                        onClick={() => {
                          if (video) {
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
                        <span className="pm-file-icon">
                          {icon}
                        </span>

                        <span>
                          <span className="pm-file-title">
                            {getTitle(item)}
                          </span>

                          <span className="pm-file-type">
                            {type}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <nav className="pm-bottom">
        <button
          className={`pm-nav ${
            page === 'community'
              ? 'active'
              : ''
          }`}
          onClick={() => {
            setPage('community');
            setMenuOpen(false);
          }}
        >
          <span className="pm-nav-icon">
            💬
          </span>
          Community
        </button>

        <button
          className={`pm-nav ${
            page === 'my-batches'
              ? 'active'
              : ''
          }`}
          onClick={goMyBatches}
        >
          <span className="pm-nav-icon">
            📖
          </span>
          My Batches
        </button>

        <button
          className={`pm-nav ${
            page === 'home' ? 'active' : ''
          }`}
          onClick={goHome}
        >
          <span className="pm-nav-icon">
            📚
          </span>
          Batches
        </button>

        <button
          className={`pm-nav ${
            page === 'ai' ? 'active' : ''
          }`}
          onClick={() => {
            setPage('ai');
            setMenuOpen(false);
          }}
        >
          <span className="pm-nav-icon">
            🤖
          </span>
          AI Doubts
        </button>
      </nav>

      {page === 'community' && (
        <div
          className="pm-modal-overlay"
          onClick={goHome}
        >
          <div className="pm-modal-wrap">
            <div
              className="pm-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h3>💬 Community</h3>

              <p>
                This feature is coming soon.
              </p>

              <button
                className="pm-btn pm-btn-primary"
                style={{ width: '100%' }}
                onClick={goHome}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {page === 'ai' && (
        <div
          className="pm-modal-overlay"
          onClick={goHome}
        >
          <div className="pm-modal-wrap">
            <div
              className="pm-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h3>🤖 AI Doubts</h3>

              <p>
                This feature is coming soon.
              </p>

              <button
                className="pm-btn pm-btn-primary"
                style={{ width: '100%' }}
                onClick={goHome}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {enrollBatch && (
        <div
          className="pm-modal-overlay"
          onClick={() =>
            setEnrollBatch(null)
          }
        >
          <div className="pm-modal-wrap">
            <div
              className="pm-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <h3>
                Congratulations 🎉
              </h3>

              <p>
                You have successfully enrolled
                in{' '}
                <strong>
                  {enrollBatch?.title ||
                    enrollBatch?.name}
                </strong>
                .
              </p>

              <div className="pm-modal-actions">
                <button
                  className="pm-btn pm-btn-primary"
                  onClick={() =>
                    enroll(enrollBatch)
                  }
                >
                  Continue
                </button>

                <button
                  className="pm-btn pm-btn-light"
                  onClick={() =>
                    setEnrollBatch(null)
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {player && (
        <div className="pm-player-overlay">
          <div className="pm-player">
            <div className="pm-player-head">
              <button
                className="pm-player-back"
                onClick={closePlayer}
              >
                ←
              </button>

              <div className="pm-player-title">
                {player.title ||
                  'Prep Master'}
              </div>
            </div>

            {player.type ===
              'loading' && (
              <div className="pm-video-area">
                <div
                  style={{
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  Loading video...
                </div>
              </div>
            )}

            {player.type ===
              'video' && (
              <div className="pm-video-area">
                <video
                  className="pm-video"
                  controls
                  playsInline
                  preload="metadata"
                  src={player.url}
                />
              </div>
            )}

            {player.type === 'pdf' && (
              <div className="pm-pdf-area">
                <iframe
                  className="pm-pdf"
                  src={player.url}
                  title={
                    player.title ||
                    'PDF Viewer'
                  }
                />
              </div>
            )}

            {player.type ===
              'test-loading' && (
              <div className="pm-test-area">
                <div className="pm-test-card">
                  Loading test instructions...
                </div>
              </div>
            )}

            {player.type ===
              'test-instructions' && (
              <div className="pm-test-area">
                <div className="pm-test-card">
                  <h2>
                    📝 {player.title}
                  </h2>

                  <div
                    style={{
                      marginTop: 15,
                      lineHeight: 1.7,
                      color: '#475569',
                    }}
                  >
                    {renderInstructions(
                      testInstructions
                    )}
                  </div>

                  {testError && (
                    <div
                      className="pm-error"
                      style={{
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      {testError}
                    </div>
                  )}

                  <button
                    className="pm-btn pm-btn-primary"
                    style={{
                      width: '100%',
                      marginTop: 20,
                    }}
                    disabled={testLoading}
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
              </div>
            )}

            {player.type === 'test' &&
              activeTest && (
                <div className="pm-test-area">
                  <div className="pm-test-card">
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
                          <div
                            style={{
                              color:
                                '#64748b',
                              fontSize: 13,
                              marginBottom: 10,
                            }}
                          >
                            Question{' '}
                            {testIndex + 1}{' '}
                            of{' '}
                            {
                              activeTest
                                .questions
                                .length
                            }
                          </div>

                          <h2
                            style={{
                              fontSize: 19,
                              lineHeight: 1.5,
                              marginTop: 0,
                            }}
                          >
                            {getQuestionText(
                              question
                            )}
                          </h2>

                          <div>
                            {options.map(
                              (
                                option,
                                index
                              ) => {
                                const key =
                                  getOptionKey(
                                    option,
                                    index
                                  );

                                const selected =
                                  String(
                                    testAnswers[
                                      testIndex
                                    ]
                                  ) ===
                                  String(key);

                                return (
                                  <button
                                    key={key}
                                    className={`pm-test-option ${
                                      selected
                                        ? 'selected'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      selectAnswer(
                                        testIndex,
                                        key
                                      )
                                    }
                                  >
                                    {String.fromCharCode(
                                      65 +
                                        index
                                    )}
                                    .{' '}
                                    {getOptionText(
                                      option
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>

                          <div className="pm-test-actions">
                            <button
                              className="pm-btn pm-btn-light"
                              disabled={
                                testIndex ===
                                0
                              }
                              onClick={() =>
                                setTestIndex(
                                  (value) =>
                                    Math.max(
                                      0,
                                      value -
                                        1
                                    )
                                )
                              }
                            >
                              ← Previous
                            </button>

                            {testIndex <
                            activeTest
                              .questions
                              .length -
                              1 ? (
                              <button
                                className="pm-btn pm-btn-primary"
                                onClick={() =>
                                  setTestIndex(
                                    (value) =>
                                      Math.min(
                                        activeTest
                                          .questions
                                          .length -
                                          1,
                                        value +
                                          1
                                      )
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
                </div>
              )}

            {player.type ===
              'test-result' && (
              <div className="pm-test-area">
                <div className="pm-test-card">
                  <h2>
                    🎉 Test Completed
                  </h2>

                  {testResult && (
                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                        marginTop: 18,
                      }}
                    >
                      <div>
                        Total Questions:{' '}
                        <strong>
                          {
                            testResult.total
                          }
                        </strong>
                      </div>

                      <div>
                        Attempted:{' '}
                        <strong>
                          {
                            testResult.attempted
                          }
                        </strong>
                      </div>

                      <div>
                        Correct:{' '}
                        <strong>
                          {
                            testResult.correct
                          }
                        </strong>
                      </div>
                    </div>
                  )}

                  <button
                    className="pm-btn pm-btn-primary"
                    style={{
                      width: '100%',
                      marginTop: 22,
                    }}
                    onClick={closePlayer}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {player.type ===
              'error' && (
              <div className="pm-test-area">
                <div className="pm-test-card">
                  <h2>
                    Something went wrong
                  </h2>

                  <p
                    style={{
                      color: '#b91c1c',
                    }}
                  >
                    {player.error}
                  </p>

                  <button
                    className="pm-btn pm-btn-primary"
                    style={{
                      width: '100%',
                    }}
                    onClick={closePlayer}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderInstructions(data) {
  if (!data) {
    return (
      <p>
        Test instructions available nahi
        hain.
      </p>
    );
  }

  if (typeof data === 'string') {
    return <p>{data}</p>;
  }

  if (Array.isArray(data)) {
    return (
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            {typeof item === 'string'
              ? item
              : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }

  const fields = [
    ['Instructions', data.instructions],
    ['Description', data.description],
    ['Duration', data.duration],
    ['Total Questions', data.total_questions],
    ['Marks', data.total_marks],
    ['Negative Marking', data.negative_marking],
  ];

  const available = fields.filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== ''
  );

  if (available.length === 0) {
    return (
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return (
    <div>
      {available.map(
        ([label, value]) => (
          <div
            key={label}
            style={{
              marginBottom: 10,
            }}
          >
            <strong>{label}:</strong>{' '}
            {typeof value === 'object'
              ? JSON.stringify(value)
              : String(value)}
          </div>
        )
      )}
    </div>
  );
}
