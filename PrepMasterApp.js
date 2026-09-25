'use client';

import { useEffect, useMemo, useState } from 'react';

const defaults = {
  appName: 'Prep Master',
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL || '',
  ownerContact: process.env.NEXT_PUBLIC_OWNER_CONTACT || '',
  heroTitle: 'Learn smarter. Prepare better.',
  heroSubtitle: 'Your study space for batches, lectures and notes.',
};

function arr(x) {
  if (Array.isArray(x)) return x;

  if (x && Array.isArray(x.data)) return x.data;
  if (x && Array.isArray(x.items)) return x.items;
  if (x && Array.isArray(x.content)) return x.content;

  if (x?.data && Array.isArray(x.data.items)) {
    return x.data.items;
  }

  if (x?.data && Array.isArray(x.data.content)) {
    return x.data.content;
  }

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
  if (!x || typeof x !== 'object') {
    return 'Untitled';
  }

  return (
    x.title ??
    x.name ??
    x.folder_name ??
    x.content_name ??
    x.subject_name ??
    'Untitled'
  );
}

function folder(x) {
  if (!x || typeof x !== 'object') {
    return false;
  }

  const type = String(
    x.type ??
      x.content_type ??
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

export default function PrepMasterApp() {
  const [s, setS] = useState(defaults);
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

    fetch('/api/batches', {
      cache: 'no-store',
    })
      .then(async (r) => {
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

        return j;
      })
      .then((j) => {
        setBs(
          Array.isArray(j.batches)
            ? j.batches
            : []
        );
      })
      .catch((e) => {
        setErr(
          e.message || 'Unable to load batches'
        );
      });
  }, []);

  const filtered = useMemo(() => {
    return bs.filter((b) =>
      `${b.title || ''} ${b.description || ''}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  }, [bs, q]);

  const save = (x) => {
    setEn(x);

    try {
      localStorage.setItem(
        'pm_enrolled',
        JSON.stringify(x)
      );
    } catch {}
  };

  async function open(b) {
    setSel(b);
    setPage('study');
    setStack([]);
    setItems([]);
    setLoading(true);
    setErr('');

    try {
      const r = await fetch(
        `/api/content?content=${encodeURIComponent(
          String(b.id).trim()
        )}&folder=0`,
        {
          cache: 'no-store',
        }
      );

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Content API returned HTML instead of JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error || 'Unable to load content'
        );
      }

      setItems(arr(j.data));
    } catch (e) {
      setErr(
        e.message || 'Unable to load content'
      );
    } finally {
      setLoading(false);
    }
  }

  async function openFolder(x) {
    if (!sel) {
      setErr('Batch is not selected');
      return;
    }

    const folderId = id(x);

    if (!folderId) {
      setErr('Folder ID not found');
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const r = await fetch(
        `/api/content?content=${encodeURIComponent(
          String(sel.id).trim()
        )}&folder=${encodeURIComponent(folderId)}`,
        {
          cache: 'no-store',
        }
      );

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Folder API returned HTML instead of JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error || 'Unable to open folder'
        );
      }

      setStack((previous) => [
        ...previous,
        {
          items,
          title: title(x),
        },
      ]);

      setItems(arr(j.data));
    } catch (e) {
      setErr(
        e.message || 'Unable to open folder'
      );
    } finally {
      setLoading(false);
    }
  }

  async function lesson(x) {
    if (!sel) {
      setErr('Batch is not selected');
      return;
    }

    const contentId = id(x);

    if (!contentId) {
      setErr('Content ID not found');
      return;
    }

    setLoading(true);
    setErr('');

    try {
      const r = await fetch(
        `/api/playback?content_id=${encodeURIComponent(
          contentId
        )}&course_id=${encodeURIComponent(
          String(sel.id).trim()
        )}`,
        {
          cache: 'no-store',
        }
      );

      const text = await r.text();

      let j;

      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(
          'Playback API returned HTML instead of JSON'
        );
      }

      if (!r.ok || !j.success) {
        throw new Error(
          j.error || 'Unable to load playback'
        );
      }

      const playableUrl =
        j.url ||
        j.data?.decryptedData?.file_url ||
        j.data?.url ||
        j.data?.file_url ||
        j.data?.data?.decryptedData?.file_url ||
        null;

      if (!playableUrl) {
        throw new Error(
          'No playable URL returned'
        );
      }

      setPlayer({
        title: title(x),
        url: playableUrl,
      });
    } catch (e) {
      setErr(
        e.message || 'Unable to play lesson'
      );
    } finally {
      setLoading(false);
    }
  }

  const card = (b) => (
    <article className="batchCard">
      <img
        src={
          b.thumbnail ||
          '/prep-master-logo.png'
        }
        alt=""
      />

      <div className="batchBody">
        <h3>{b.title}</h3>

        <p>
          {b.description ||
            'Study material, lectures and notes.'}
        </p>

        <div className="priceRow">
          {b.price || 'FREE'}

          {b.mrp && (
            <del>{b.mrp}</del>
          )}
        </div>

        <div className="cardActions">
          <button
            className="secondary"
            onClick={() => open(b)}
          >
            Study
          </button>

          {en.some(
            (x) =>
              String(x.id) ===
              String(b.id)
          ) ? (
            <button
              className="primary"
              onClick={() => open(b)}
            >
              LET’S STUDY
            </button>
          ) : (
            <button
              className="primary"
              onClick={() => {
                setSel(b);
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

  return (
    <div className="appShell">

      {/* HEADER */}

      <header className="topbar">
        <div className="brand">
          <img
            src="/prep-master-logo.png"
            alt="Prep Master"
          />

          <strong>{s.appName}</strong>
        </div>

        <button
          className="iconBtn"
          onClick={() =>
            setMenu(!menu)
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
              if (s.telegramUrl) {
                window.open(
                  s.telegramUrl,
                  '_blank'
                );
              }
            }}
          >
            ✈️ Join Telegram
          </button>

          <button
            onClick={() => {
              if (s.ownerContact) {
                window.open(
                  s.ownerContact,
                  '_blank'
                );
              }
            }}
          >
            👤 Contact Owner
          </button>

          <button
            onClick={() => {
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
                .map((b) => (
                  <div key={b.id}>
                    {card(b)}
                  </div>
                ))}
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

          <div className="batchGrid">
            {filtered.map((b) => (
              <div key={b.id}>
                {card(b)}
              </div>
            ))}
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
              {en.map((b) => (
                <div key={b.id}>
                  {card(b)}
                </div>
              ))}
            </div>
          )}

        </main>
      )}

      {/* LEARNING SCREEN */}

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

            <div>
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

            <button
              className="unenrollBtn"
              onClick={() => {
                save(
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
                onClick={() => {
                  const z = [
                    ...stack,
                  ];

                  const last =
                    z.pop();

                  setStack(z);
                  setItems(
                    last?.items || []
                  );
                  setErr('');
                }}
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
                (x, i) => (
                  <button
                    className="contentRow"
                    key={
                      id(x) || i
                    }
                    onClick={() =>
                      folder(x)
                        ? openFolder(x)
                        : lesson(x)
                    }
                  >

                    <span className="contentIcon">
                      {folder(x)
                        ? '📁'
                        : '▶️'}
                    </span>

                    <span>
                      <b>
                        {title(x)}
                      </b>

                      <small>
                        {folder(x)
                          ? 'Open folder'
                          : 'Open lesson'}
                      </small>
                    </span>

                    <span>
                      ›
                    </span>

                  </button>
                )
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
              onClick={() => {
                save([
                  ...en.filter(
                    (x) =>
                      String(x.id) !==
                      String(sel.id)
                  ),
                  sel,
                ]);

                setEnroll(false);
              }}
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
          className="active"
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
