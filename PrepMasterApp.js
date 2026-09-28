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

  function openBatch(batch) {
    const batchId = getId(batch);

    if (!batchId) {
      alert('Batch ID is missing.');
      return;
    }

    const targetUrl = `https://nexthope.pages.dev/nt/content?id=${encodeURIComponent(batchId)}`;
    window.location.href = targetUrl;
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

      {SideMenu()}

      {BottomNav()}

      <EnrollPopup />

      <TelegramPopup />
    </div>
  );
}
