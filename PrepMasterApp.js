'use client';

import { useEffect, useMemo, useState } from 'react';

const defaults = {
  appName: 'Prep Master',
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL || '',
  ownerContact: process.env.NEXT_PUBLIC_OWNER_CONTACT || '',
  heroTitle: 'Learn smarter. Prepare better.',
  heroSubtitle: 'Your study space for batches, lectures and notes.',
};

/* =========================
   HELPERS
========================= */

function arr(x) {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.data?.data)) return x.data.data;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.content)) return x.content;
  return [];
}

function id(x) {
  if (!x || typeof x !== 'object') return '';

  return String(
    x.entity_id ??
      x.folder_id ??
      x.content_id ??
      x.course_content_id ??
      x.id ??
      ''
  ).trim();
}

function title(x) {
  if (!x || typeof x !== 'object') return 'Untitled';

  return (
    x.title ??
    x.name ??
    x.folder_name ??
    x.content_name ??
    x.subject_name ??
    'Untitled'
  );
}

function isFolder(x) {
  if (!x || typeof x !== 'object') return false;

  const type = String(
    x.type ??
      x.entity_type ??
      x.item_type ??
      ''
  ).toLowerCase();

  return (
    type.includes('folder') ||
    type === 'directory' ||
    x.is_folder === true ||
    x.isFolder === true ||
    x.folder === true
  );
}

function fileType(x) {
  return String(
    x?.data?.file_type ??
      x?.file_type ??
      ''
  );
}

function contentType(x) {
  return String(
    x?.data?.content_type ??
      x?.content_type ??
      ''
  );
}

function hasPdf(x) {
  return String(
    x?.data?.has_pdf ??
      x?.has_pdf ??
      ''
  ) === '1';
}

function isVideo(x) {
  return (
    fileType(x) === '2' ||
    contentType(x) === '2'
  );
}

function isPdf(x) {
  return (
    hasPdf(x) ||
    fileType(x) === '3' ||
    contentType(x) === '3' ||
    Boolean(
      x?.data?.pdf_url ||
      x?.pdf_url ||
      x?.data?.file_url ||
      x?.file_url
    )
  );
}

/* =========================
   APP
========================= */

export default function PrepMasterApp() {
  const [s] = useState(defaults);

  const [bs, setBs] = useState([]);
  const [en, setEn] = useState([]);

  const [page, setPage] = useState('home');
  const [q, setQ] = useState('');

  const [sel, setSel] = useState(null);

  const [items, setItems] = useState([]);
  const [stack, setStack] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [menu, setMenu] = useState(false);
  const [enroll, setEnroll] = useState(false);

  const [player, setPlayer] = useState(null);
  const [pdf, setPdf] = useState(null);

  /* =========================
     LOAD BATCHES
  ========================= */

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('pm_enrolled') || '[]'
      );

      if (Array.isArray(saved)) {
        setEn(saved);
      }
    } catch {
      setEn([]);
    }

    loadBatches();
  }, []);

  async function loadBatches() {
    try {
      setErr('');

      const r = await fetch('/api/batches', {
        cache: 'no-store',
      });

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Batches API returned invalid JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error || 'Unable to load batches'
        );
      }

      setBs(
        Array.isArray(j.batches)
          ? j.batches
          : []
      );
    } catch (e) {
      setErr(
        e?.message ||
          'Unable to load batches'
      );
    }
  }

  /* =========================
     SEARCH
  ========================= */

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) return bs;

    return bs.filter((b) =>
      `${b.title || ''} ${b.description || ''}`
        .toLowerCase()
        .includes(search)
    );
  }, [bs, q]);

  /* =========================
     ENROLLMENT
  ========================= */

  function saveEnrollment(list) {
    setEn(list);

    try {
      localStorage.setItem(
        'pm_enrolled',
        JSON.stringify(list)
      );
    } catch {}
  }

  function enrollBatch() {
    if (!sel) return;

    const next = [
      ...en.filter(
        (x) =>
          String(x.id) !==
          String(sel.id)
      ),
      sel,
    ];

    saveEnrollment(next);
    setEnroll(false);
  }

  /* =========================
     OPEN BATCH
  ========================= */

  async function openBatch(batch) {
    setSel(batch);
    setPage('study');
    setStack([]);
    setItems([]);
    setLoading(true);
    setErr('');

    try {
      const url =
        `/api/content?content=${encodeURIComponent(
          String(batch.id).trim()
        )}&folder=0`;

      const r = await fetch(url, {
        cache: 'no-store',
      });

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Content API returned invalid JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error ||
            `Unable to load content (${r.status})`
        );
      }

      setItems(arr(j.data));
    } catch (e) {
      setErr(
        e?.message ||
          'Unable to load content'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     OPEN FOLDER
  ========================= */

  async function openFolder(item) {
    if (!sel) {
      setErr('Batch is not selected');
      return;
    }

    const folderId = id(item);

    if (!folderId) {
      setErr('Folder ID not found');
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const url =
        `/api/content?content=${encodeURIComponent(
          String(sel.id).trim()
        )}&folder=${encodeURIComponent(
          folderId
        )}`;

      const r = await fetch(url, {
        cache: 'no-store',
      });

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Folder API returned invalid JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error ||
            `Unable to open folder (${r.status})`
        );
      }

      setStack((previous) => [
        ...previous,
        {
          items: items,
          title: title(item),
        },
      ]);

      setItems(arr(j.data));
    } catch (e) {
      setErr(
        e?.message ||
          'Unable to open folder'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     BACK FOLDER
  ========================= */

  function goBackFolder() {
    const copy = [...stack];

    const previous = copy.pop();

    setStack(copy);
    setItems(previous?.items || []);
    setErr('');
  }

  /* =========================
     PLAY VIDEO
  ========================= */

  async function playVideo(item) {
    if (!sel) {
      setErr('Batch is not selected');
      return;
    }

    const contentId = id(item);

    if (!contentId) {
      setErr('Content ID not found');
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const url =
        `/api/playback?content_id=${encodeURIComponent(
          contentId
        )}&course_id=${encodeURIComponent(
          String(sel.id).trim()
        )}`;

      const r = await fetch(url, {
        cache: 'no-store',
      });

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Playback API returned invalid JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error ||
            'Unable to load playback'
        );
      }

      const playableUrl =
        j.url ||
        j.data?.decryptedData?.file_url ||
        j.data?.url ||
        j.data?.file_url ||
        null;

      if (!playableUrl) {
        throw new Error(
          'No playable video URL returned'
        );
      }

      setPlayer({
        title: title(item),
        url: playableUrl,
      });
    } catch (e) {
      setErr(
        e?.message ||
          'Unable to play lesson'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     OPEN PDF / NOTE
  ========================= */

  function openPdf(item) {
    const data = item?.data || item;

    const pdfUrl =
      data?.pdf_url ||
      data?.file_url ||
      data?.download_url ||
      data?.download_urls ||
      item?.pdf_url ||
      item?.file_url ||
      item?.download_url ||
      null;

    let finalUrl = pdfUrl;

    /*
      Some APIs return download_urls as JSON text.
    */

    if (
      typeof finalUrl === 'string' &&
      finalUrl.startsWith('{')
    ) {
      try {
        const parsed =
          JSON.parse(finalUrl);

        finalUrl =
          parsed?.pdf ||
          parsed?.url ||
          parsed?.file_url ||
          parsed?.download_url ||
          null;
      } catch {}
    }

    if (
      typeof finalUrl === 'string' &&
      finalUrl.startsWith('[')
    ) {
      try {
        const parsed =
          JSON.parse(finalUrl);

        if (Array.isArray(parsed)) {
          finalUrl =
            parsed[0]?.url ||
            parsed[0]?.file_url ||
            parsed[0] ||
            null;
        }
      } catch {}
    }

    if (!finalUrl) {
      setErr(
        'PDF/Notes URL is not available for this file.'
      );
      return;
    }

    setPdf({
      title: title(item),
      url: finalUrl,
    });
  }

  /* =========================
     OPEN ANY CONTENT
  ========================= */

  function openContent(item) {
    if (isFolder(item)) {
      openFolder(item);
      return;
    }

    if (isVideo(item)) {
      playVideo(item);
      return;
    }

    if (isPdf(item)) {
      openPdf(item);
      return;
    }

    setErr(
      'This content type is not supported yet.'
    );
  }

  /* =========================
     CARD
  ========================= */

  function card(batch) {
    const enrolled = en.some(
      (x) =>
        String(x.id) ===
        String(batch.id)
    );

    return (
      <article
        className="batchCard"
        key={batch.id}
      >
        <img
          src={
            batch.thumbnail ||
            '/prep-master-logo.png'
          }
          alt=""
        />

        <div className="batchBody">
          <h3>
            {batch.title}
          </h3>

          <p>
            {batch.description ||
              'Study material, lectures and notes.'}
          </p>

          <div className="priceRow">
            {batch.price || 'FREE'}

            {batch.mrp && (
              <del>
                {batch.mrp}
              </del>
            )}
          </div>

          <div className="cardActions">
            <button
              className="secondary"
              onClick={() =>
                openBatch(batch)
              }
            >
              Study
            </button>

            {enrolled ? (
              <button
                className="primary"
                onClick={() =>
                  openBatch(batch)
                }
              >
                LET’S STUDY
              </button>
            ) : (
              <button
                className="primary"
                onClick={() => {
                  setSel(batch);
                  setEnroll(true);
                }}
              >
                Enroll
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="appShell">

      {/* HEADER */}

      <header className="topbar">
        <div className="brand">
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
          />

          <strong>
            {s.appName}
          </strong>
        </div>

        <button
          className="iconBtn"
          onClick={() =>
            setMenu((v) => !v)
          }
        >
          ⋮
        </button>
      </header>

      {/* MENU */}

      {menu && (
        <div className="menuCard">

          <button
            onClick={() => {
              setPage('batches');
              setMenu(false);
            }}
          >
            📚 Batches
          </button>

          <button
            onClick={() => {
              setPage('my');
              setMenu(false);
            }}
          >
            📖 My Batches
          </button>

          <button
            onClick={() => {
              setMenu(false);

              if (s.telegramUrl) {
                window.open(
                  s.telegramUrl,
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
              setMenu(false);

              if (s.ownerContact) {
                window.open(
                  s.ownerContact,
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
              setMenu(false);
              window.location.href =
                '/admin';
            }}
          >
            ⚙️ Admin Panel
          </button>

        </div>
      )}

      {/* HOME */}

      {page === 'home' && (
        <main>

          <section className="hero">

            <span className="eyebrow">
              PREP MASTER
            </span>

            <h1>
              {s.heroTitle}
            </h1>

            <p>
              {s.heroSubtitle}
            </p>

            <button
              className="primary"
              onClick={() =>
                setPage('batches')
              }
            >
              Explore Batches
            </button>

          </section>

          <section className="section">

            <div className="sectionHead">
              <h2>
                Latest Batches
              </h2>
            </div>

            {err && (
              <div className="errorBox">
                {err}
              </div>
            )}

            <div className="batchGrid">

              {filtered
                .slice(0, 6)
                .map((b) =>
                  card(b)
                )}

            </div>

          </section>

        </main>
      )}

      {/* ALL BATCHES */}

      {page === 'batches' && (
        <main className="page">

          <div className="pageHead">
            <h1>
              All Batches
            </h1>

            <p>
              Find your course and start learning.
            </p>
          </div>

          <input
            className="search"
            placeholder="Search batches..."
            value={q}
            onChange={(e) =>
              setQ(e.target.value)
            }
          />

          {err && (
            <div className="errorBox">
              {err}
            </div>
          )}

          <div className="batchGrid">

            {filtered.map((b) =>
              card(b)
            )}

          </div>

        </main>
      )}

      {/* MY BATCHES */}

      {page === 'my' && (
        <main className="page">

          <div className="pageHead">

            <h1>
              My Batches
            </h1>

            <p>
              Your enrolled courses.
            </p>

          </div>

          {!en.length ? (
            <div className="empty">
              No enrolled batches yet.
            </div>
          ) : (
            <div className="batchGrid">
              {en.map((b) =>
                card(b)
              )}
            </div>
          )}

        </main>
      )}

      {/* STUDY */}

      {page === 'study' && sel && (
        <div className="learningFullScreen">

          <div className="learningTopBar">

            <button
              className="backBtn"
              onClick={() => {
                setPage('home');
                setSel(null);
                setItems([]);
                setStack([]);
                setErr('');
              }}
            >
              ←
            </button>

            <div className="learningTitle">

              <b>
                {sel.title}
              </b>

              <small>
                {stack.length
                  ? stack[
                      stack.length - 1
                    ].title
                  : 'All Content'}
              </small>

            </div>

            {en.some(
              (x) =>
                String(x.id) ===
                String(sel.id)
            ) && (
              <button
                className="unenrollBtn"
                onClick={() => {
                  saveEnrollment(
                    en.filter(
                      (x) =>
                        String(x.id) !==
                        String(sel.id)
                    )
                  );

                  setPage('my');
                  setSel(null);
                  setItems([]);
                  setStack([]);
                }}
              >
                Unenroll
              </button>
            )}

          </div>

          <div className="learningScroll">

            <div className="overviewBox">

              <h2>
                {sel.title}
              </h2>

              <p>
                {sel.description ||
                  'Batch overview'}
              </p>

            </div>

            {stack.length > 0 && (
              <button
                className="folderBack"
                onClick={
                  goBackFolder
                }
              >
                ← Back
              </button>
            )}

            {loading && (
              <div className="loading">
                Loading…
              </div>
            )}

            {err && (
              <div className="errorBox">
                {err}
              </div>
            )}

            <div className="contentList">

              {!loading &&
                !err &&
                items.length === 0 && (
                  <div className="empty">
                    No content available.
                  </div>
                )}

              {items.map(
                (item, index) => {

                  const folderItem =
                    isFolder(item);

                  const video =
                    isVideo(item);

                  const pdfFile =
                    isPdf(item);

                  return (
                    <button
                      className="contentRow"
                      key={
                        id(item) ||
                        index
                      }
                      onClick={() =>
                        openContent(item)
                      }
                    >

                      <span className="contentIcon">

                        {folderItem
                          ? '📁'
                          : video
                          ? '▶️'
                          : pdfFile
                          ? '📄'
                          : '📝'}

                      </span>

                      <span className="contentText">

                        <b>
                          {title(item)}
                        </b>

                        <small>

                          {folderItem
                            ? 'Open folder'
                            : video
                            ? 'Open video'
                            : pdfFile
                            ? 'Open PDF / Notes'
                            : 'Open content'}

                        </small>

                      </span>

                      <span>
                        ›
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>
      )}

      {/* ENROLL MODAL */}

      {enroll && sel && (
        <div
          className="modalShade"
          onClick={() =>
            setEnroll(false)
          }
        >

          <div
            className="modalCard"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="successIcon">
              ✓
            </div>

            <h2>
              Congratulations 🎉
            </h2>

            <p>
              You are enrolling in{' '}
              <b>
                {sel.title}
              </b>.
            </p>

            <button
              className="primary wide"
              onClick={
                enrollBatch
              }
            >
              Enroll Now
            </button>

          </div>

        </div>
      )}

      {/* VIDEO PLAYER */}

      {player && (
        <div className="playerShade">

          <div className="playerCard">

            <div className="playerHead">

              <b>
                {player.title}
              </b>

              <button
                onClick={() =>
                  setPlayer(null)
                }
              >
                ✕
              </button>

            </div>

            <video
              className="videoPlayer"
              controls
              playsInline
              preload="metadata"
              src={player.url}
            />

          </div>

        </div>
      )}

      {/* PDF VIEWER */}

      {pdf && (
        <div className="playerShade">

          <div className="playerCard">

            <div className="playerHead">

              <b>
                {pdf.title}
              </b>

              <button
                onClick={() =>
                  setPdf(null)
                }
              >
                ✕
              </button>

            </div>

            <iframe
              title={pdf.title}
              src={pdf.url}
              style={{
                width: '100%',
                height: '75vh',
                border: '0',
                background: '#fff',
              }}
            />

          </div>

        </div>
      )}

      {/* DEVELOPER */}

      <div className="developerText">
        DEVELOPED BY SUBHAN ALI &amp; PREP MASTER
      </div>

      {/* BOTTOM NAV */}

      <nav className="bottom">

        <button
          onClick={() =>
            alert(
              'This feature is coming soon'
            )
          }
        >
          💬
          <span>
            Community
          </span>
        </button>

        <button
          onClick={() =>
            setPage('my')
          }
        >
          📖
          <span>
            My Batches
          </span>
        </button>

        <button
          className={
            page === 'batches'
              ? 'active'
              : ''
          }
          onClick={() =>
            setPage('batches')
          }
        >
          📚
          <span>
            Batches
          </span>
        </button>

        <button
          onClick={() =>
            alert(
              'This feature is coming soon'
            )
          }
        >
          🤖
          <span>
            AI Doubts
          </span>
        </button>

      </nav>

    </div>
  );
}
