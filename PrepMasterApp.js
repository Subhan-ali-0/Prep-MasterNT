'use client';

import { useEffect, useMemo, useState } from 'react';

const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ||
  'https://t.me/prepmaster0';

const OWNER_CONTACT =
  process.env.NEXT_PUBLIC_OWNER_CONTACT ||
  'https://t.me/Subhanali011';

/* =========================================================
   HELPERS
========================================================= */

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

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
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

  /* =========================================================
     COURSE VIEWER
  ========================================================= */

  const [activeBatchUrl, setActiveBatchUrl] = useState('');
  const [courseOpen, setCourseOpen] = useState(false);

  /* ---------------- MENU / POPUPS ---------------- */

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [enrollPopup, setEnrollPopup] =
    useState(false);

  const [telegramPopup, setTelegramPopup] =
    useState(false);

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
     OPEN BATCH
  ========================================================= */

  const openBatch = (batch) => {
  const batchId = getId(batch);

  if (!batchId) {
    alert("Batch ID nahi mili");
    return;
  }

  window.location.href = `https://nt.nextstudys.site/course/${encodeURIComponent(batchId)}`;
};

    setActiveBatchUrl(targetUrl);
    setCourseOpen(true);
  }

  /* =========================================================
     CLOSE COURSE
  ========================================================= */

  function closeCourse() {
    setCourseOpen(false);
    setActiveBatchUrl('');
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
      <div
        className="pm-page"
        style={{
          backgroundColor: '#000000',
          color: '#f3f4f6',
          minHeight: '100vh',
          paddingBottom: '80px'
        }}
      >
        <div
          className="pm-header"
          style={{
            backgroundColor: '#121212',
            borderBottom: '1px solid #222222',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div
            className="pm-brand"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#ffffff'
            }}
          >
            <img
              src="/prep-master-logo.png"
              alt="Prep Master"
              className="pm-logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%'
              }}
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
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ⋮
          </button>
        </div>

        <div
          className="pm-search-wrap"
          style={{ padding: '16px' }}
        >
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
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#ffffff',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        {loading ? (
          <div
            className="pm-state"
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a1a1aa'
            }}
          >
            Loading batches...
          </div>
        ) : error ? (
          <div
            className="pm-state pm-error"
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#ef4444'
            }}
          >
            {error}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div
            className="pm-state"
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a1a1aa'
            }}
          >
            No batches found.
          </div>
        ) : (
          <div
            className="pm-batch-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              padding: '0 16px'
            }}
          >
            {filteredBatches.map((batch) => (
              <BatchCard
                batch={batch}
                key={getId(batch)}
              />
            ))}
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

    const price = formatPrice(
      getPrice(batch)
    );

    const mrpValue =
      batch?.mrp ??
      batch?.data?.mrp;

    const mrp =
      mrpValue != null &&
      Number(mrpValue) >
        Number(getPrice(batch) || 0)
        ? formatPrice(mrpValue)
        : '';

    const isNew =
      isFlagOn(batch?.is_new);

    const isTrending =
      isFlagOn(batch?.is_trending);

    return (
      <div
        className="pm-batch-card"
        style={{
          backgroundColor: '#141414',
          border: '1px solid #222222',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {getBatchImage(batch) ? (
          <img
            src={getBatchImage(batch)}
            alt={getTitle(batch)}
            className="pm-batch-image"
            style={{
              width: '100%',
              height: '160px',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            className="pm-batch-image pm-image-placeholder"
            style={{
              width: '100%',
              height: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1f1f23',
              fontSize: '32px'
            }}
          >
            📚
          </div>
        )}

        <div
          className="pm-batch-body"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between'
          }}
        >
          <div>
            {(isNew || isTrending) && (
              <div
                className="pm-badge-row"
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '8px'
                }}
              >
                {isNew && (
                  <span
                    className="pm-badge pm-badge-new"
                    style={{
                      backgroundColor: '#1e3a8a',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    New
                  </span>
                )}

                {isTrending && (
                  <span
                    className="pm-badge pm-badge-trending"
                    style={{
                      backgroundColor: '#581c87',
                      color: '#c084fc',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    Trending
                  </span>
                )}
              </div>
            )}

            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '8px',
                lineHeight: '1.4'
              }}
            >
              {getTitle(batch)}
            </h3>

            {getDescription(batch) && (
              <p
                style={{
                  fontSize: '13px',
                  color: '#a1a1aa',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {getDescription(batch)}
              </p>
            )}
          </div>

          <div>
            {price && (
              <div
                className="pm-price"
                style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {price}

                {mrp && (
                  <span
                    className="pm-mrp"
                    style={{
                      fontSize: '12px',
                      color: '#71717a',
                      textDecoration:
                        'line-through',
                      fontWeight: 'normal'
                    }}
                  >
                    {mrp}
                  </span>
                )}
              </div>
            )}

            <div
              className="pm-card-actions"
              style={{
                display: 'flex',
                gap: '8px'
              }}
            >
              <button
                type="button"
                className="pm-secondary"
                onClick={() =>
                  openBatch(batch)
                }
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#27272a',
                  border:
                    '1px solid #3f3f46',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
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
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor:
                    enrolledAlready
                      ? '#047857'
                      : '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {enrolledAlready
                  ? 'Enrolled'
                  : 'Enroll'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MY BATCHES
  ========================================================= */

  function MyBatchesPage() {
    return (
      <div
        className="pm-page"
        style={{
          backgroundColor: '#000000',
          color: '#f3f4f6',
          minHeight: '100vh',
          padding: '16px',
          paddingBottom: '80px'
        }}
      >
        <div
          className="pm-section-title"
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '20px'
          }}
        >
          My Batches
        </div>

        {enrolled.length === 0 ? (
          <div
            className="pm-state"
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#a1a1aa'
            }}
          >
            Abhi koi batch enrolled nahi hai.
          </div>
        ) : (
          <div
            className="pm-batch-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {enrolled.map((batch) => (
              <BatchCard
                batch={batch}
                key={getId(batch)}
              />
            ))}
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
      <div
        className="pm-page"
        style={{
          backgroundColor: '#000000',
          color: '#f3f4f6',
          minHeight: '100vh',
          padding: '16px',
          paddingBottom: '80px'
        }}
      >
        <div
          className="pm-section-title"
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '20px'
          }}
        >
          💬 Community
        </div>

        <div
          className="pm-coming-soon"
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#141414',
            border: '1px solid #222222',
            borderRadius: '12px',
            marginTop: '40px'
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}
          >
            💬
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '8px'
            }}
          >
            Coming Soon
          </h2>

          <p
            style={{
              color: '#a1a1aa',
              fontSize: '14px'
            }}
          >
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
      <div
        className="pm-page"
        style={{
          backgroundColor: '#000000',
          color: '#f3f4f6',
          minHeight: '100vh',
          padding: '16px',
          paddingBottom: '80px'
        }}
      >
        <div
          className="pm-section-title"
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '20px'
          }}
        >
          🤖 AI Doubts Support
        </div>

        <div
          className="pm-coming-soon"
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: '#141414',
            border: '1px solid #222222',
            borderRadius: '12px',
            marginTop: '40px'
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}
          >
            🤖
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '8px'
            }}
          >
            Coming Soon
          </h2>

          <p
            style={{
              color: '#a1a1aa',
              fontSize: '14px'
            }}
          >
            AI Doubts Support jaldi
            available hoga.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     COURSE VIEWER
  ========================================================= */

  function CourseViewer() {
    if (!courseOpen || !activeBatchUrl) {
      return null;
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          backgroundColor: '#000000',
          overflow: 'hidden'
        }}
      >
        {/* PREP MASTER HEADER */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '72px',
            backgroundColor: '#121212',
            borderBottom:
              '1px solid #222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            zIndex: 20,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <img
              src="/prep-master-logo.png"
              alt="Prep Master"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />

            <span
              style={{
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: '700'
              }}
            >
              Prep Master
            </span>
          </div>

          <button
            type="button"
            onClick={closeCourse}
            aria-label="Close course"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '30px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '5px 10px'
            }}
          >
            ×
          </button>
        </div>

        {/* CROPPED COURSE AREA */}
        <div
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            backgroundColor: '#000000'
          }}
        >
          <iframe
            src={activeBatchUrl}
            title="Prep Master Course"
            allowFullScreen
            style={{
              position: 'absolute',

              /*
               * Upar ka external header crop.
               * Is value ko zarurat ke hisaab se
               * -140px / -170px / -200px kar sakte ho.
               */
              top: '-170px',

              left: 0,
              width: '100%',

              /*
               * Cropping compensate karne ke liye
               * iframe ki height badhai gayi hai.
               */
              height: 'calc(100% + 170px)',

              border: 'none',
              display: 'block'
            }}
          />
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
      <div
        className="pm-popup-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor:
            'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}
      >
        <div
          className="pm-popup-card"
          style={{
            backgroundColor: '#141414',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            className="pm-popup-icon"
            style={{
              fontSize: '40px',
              marginBottom: '16px'
            }}
          >
            🎉
          </div>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '12px'
            }}
          >
            Congratulations 🎉
          </h2>

          <p
            style={{
              color: '#a1a1aa',
              fontSize: '14px',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}
          >
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
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
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
      <div
        className="pm-popup-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor:
            'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}
      >
        <div
          className="pm-popup-card"
          style={{
            backgroundColor: '#141414',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow:
              '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}
        >
          <img
            src="/prep-master-icon.png"
            alt="Prep Master"
            className="pm-popup-logo"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              marginBottom: '16px',
              objectFit: 'cover'
            }}
          />

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '12px'
            }}
          >
            Join Prep Master
          </h2>

          <p
            style={{
              color: '#a1a1aa',
              fontSize: '14px',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}
          >
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
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '10px'
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
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontSize: '13px'
            }}
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
      <div
        className="pm-menu-panel"
        style={{
          position: 'fixed',
          top: '65px',
          right: '16px',
          backgroundColor: '#141414',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '8px',
          zIndex: 999,
          minWidth: '200px',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <button
          type="button"
          onClick={() =>
            navigateFromMenu('batches')
          }
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          📚 Batches
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu('my-batches')
          }
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          📖 My Batches
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu('community')
          }
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          💬 Community
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu('ai')
          }
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          🤖 AI Doubts Support
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu('telegram')
          }
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
        >
          ✈️ Join Telegram
        </button>

        <button
          type="button"
          onClick={() =>
            navigateFromMenu('contact')
          }
          style={{
            textAlign: 'left',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f3f4f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            width: '100%'
          }}
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
    return (
      <div
        className="pm-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#121212',
          borderTop:
            '1px solid #222222',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
          zIndex: 998
        }}
      >
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
          style={{
            background: 'none',
            border: 'none',
            color:
              page === 'community'
                ? '#38bdf8'
                : '#a1a1aa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            cursor: 'pointer',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            💬
          </span>
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
          style={{
            background: 'none',
            border: 'none',
            color:
              page === 'my-batches'
                ? '#38bdf8'
                : '#a1a1aa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            cursor: 'pointer',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            📖
          </span>
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
          style={{
            background: 'none',
            border: 'none',
            color:
              page === 'batches'
                ? '#38bdf8'
                : '#a1a1aa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            cursor: 'pointer',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            📚
          </span>
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
          style={{
            background: 'none',
            border: 'none',
            color:
              page === 'ai'
                ? '#38bdf8'
                : '#a1a1aa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            cursor: 'pointer',
            gap: '2px'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            🤖
          </span>
          AI Doubts
        </button>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="pm-app"
      style={{
        backgroundColor: '#000000',
        color: '#f3f4f6',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {page === 'batches' &&
        BatchesPage()}

      {page === 'my-batches' &&
        MyBatchesPage()}

      {page === 'community' &&
        CommunityPage()}

      {page === 'ai' &&
        AiPage()}

      {SideMenu()}

      {BottomNav()}

      <EnrollPopup />

      <TelegramPopup />

      {/* COURSE VIEWER - SABSE UPAR */}
      <CourseViewer />
    </div>
  );
}
