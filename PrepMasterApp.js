'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pm_enrolled';
const TELEGRAM_URL = process.env.https://t.me/prepmaster0 || '';
const OWNER_CONTACT = process.env.t.me/Subhanali011 || '';

function date(v) {
  if (!v) return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const d = new Date(n > 1e10 ? n : n * 1000);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Icon({ children }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function BatchCard({ b, enrolled, onStudy, onEnroll }) {
  const p = Number(b.offer_price);
  const price = Number.isFinite(p) && p === 0 ? 'FREE' : (b.price || 'FREE');

  return (
    <article className="card">
      <div className="pic">
        {b.thumbnail ? <img src={b.thumbnail} alt={b.title} /> : <div className="placeholder">PREP MASTER</div>}
        {b.is_new ? <span className="new">NEW</span> : null}
        <span className="freeBadge">{String(price).toUpperCase() === 'FREE' ? 'FREE' : `₹${price}`}</span>
      </div>
      <div className="body">
        <h2>{b.title}</h2>
        {b.description ? <div className="desc" dangerouslySetInnerHTML={{ __html: b.description }} /> : null}
        {(b.start_date || b.end_date) ? (
          <div className="meta"><Icon>◷</Icon><span>{b.start_date && `Starts ${date(b.start_date)}`}{b.start_date && b.end_date ? '  |  ' : ''}{b.end_date && `Ends ${date(b.end_date)}`}</span></div>
        ) : null}
        <div className="priceLine">
          <b>{String(price).toUpperCase() === 'FREE' ? 'FREE' : `₹${price}`}</b>
          <span>{enrolled ? 'Enrolled' : 'Available for Students'}</span>
        </div>
        <div className="actions">
          <button onClick={() => onEnroll(b)} className={enrolled ? 'enrolled' : 'enroll'} disabled={enrolled}>
            <Icon>{enrolled ? '✓' : '+'}</Icon>{enrolled ? 'ENROLLED' : 'ENROLL'}
          </button>
          <button onClick={() => onStudy(b)} className="study">LET&apos;S STUDY <span>→</span></button>
        </div>
      </div>
    </article>
  );
}

function ComingSoon({ type, onBack }) {
  return (
    <section className="pagePanel">
      <button className="backBtn" onClick={onBack}>← <span>Back</span></button>
      <div className="comingSoon">
        <div className="comingIcon">{type === 'community' ? '💬' : '🤖'}</div>
        <h1>This feature is coming soon</h1>
        <p>{type === 'community' ? 'Community chat will be available in a future update.' : 'AI Doubts support will be available in a future update.'}</p>
      </div>
    </section>
  );
}

function MyBatches({ enrolled, onStudy, onGoBatches }) {
  return (
    <section className="pagePanel">
      <div className="pageTitleRow">
        <div>
          <div className="eyebrow">YOUR LEARNING</div>
          <h1>My Batches</h1>
        </div>
        <span className="countBadge">{enrolled.length}</span>
      </div>
      {enrolled.length === 0 ? (
        <div className="emptyCard">
          <div className="emptyIcon">📚</div>
          <h2>No enrolled batches yet</h2>
          <p>Enroll in a batch and it will appear here.</p>
          <button onClick={onGoBatches}>Browse Batches</button>
        </div>
      ) : (
        <div className="myList">
          {enrolled.map(b => (
            <article className="myCard" key={b.id}>
              <div className="myThumb">
                {b.thumbnail ? <img src={b.thumbnail} alt="" /> : <span>PM</span>}
              </div>
              <div className="myInfo">
                <h2>{b.title}</h2>
                <div className="progressLabel"><span>Enrolled</span><span>Ready to study</span></div>
                <div className="progress"><i /></div>
              </div>
              <button onClick={() => onStudy(b)} className="miniStudy">Study →</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PrepMasterApp() {
  const [tab, setTab] = useState('batches');
  const [batches, setBatches] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setEnrolled(saved);
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/batches', { cache: 'no-store' })
      .then(async r => {
        const j = await r.json();
        if (!r.ok || !j.success) throw Error(j.error || 'Unable to load batches');
        setBatches(j.batches || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const enrolledIds = useMemo(() => new Set(enrolled.map(b => String(b.id))), [enrolled]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return s ? batches.filter(b => (b.title + ' ' + b.description).toLowerCase().includes(s)) : batches;
  }, [batches, q]);

  function saveEnrolled(next) {
    setEnrolled(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function enroll(batch) {
    if (enrolledIds.has(String(batch.id))) return;
    saveEnrolled([...enrolled, batch]);
    setSelected({ type: 'success', batch });
  }

  function openStudy(batch) {
    setSelected({ type: 'study', batch });
  }

  function selectTab(next) {
    setTab(next);
    setMenuOpen(false);
  }

  function joinTelegram() {
    setMenuOpen(false);
    if (TELEGRAM_URL) window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
    else setTelegramOpen(true);
  }

  function contactOwner() {
    setMenuOpen(false);
    if (OWNER_CONTACT) window.location.href = OWNER_CONTACT.includes(':') ? OWNER_CONTACT : `mailto:${OWNER_CONTACT}`;
    else window.alert('Owner contact is not configured yet.');
  }

  return (
    <main className="shell">
      <header className="top">
        <div className="brand" onClick={() => selectTab('batches')} role="button" tabIndex={0}>
          <img src="/prep-master-icon.png" alt="Prep Master" className="brandLogo" />
          <div className="brandText"><strong>Prep <span>Master</span></strong><small>LEARN • PRACTICE • GROW</small></div>
        </div>
        <div className="menuWrap">
          <button className="dots" aria-label="Open menu" onClick={() => setMenuOpen(v => !v)}>⋮</button>
          {menuOpen ? (
            <>
              <button className="menuBackdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
              <div className="menu">
                <button onClick={() => selectTab('batches')}><Icon>📚</Icon><span>Batches</span></button>
                <button onClick={() => selectTab('my')}><Icon>📖</Icon><span>My Batches</span></button>
                <button onClick={joinTelegram}><Icon>✈️</Icon><span>Join Telegram</span></button>
                <button onClick={contactOwner}><Icon>👤</Icon><span>Contact Owner</span></button>
              </div>
            </>
          ) : null}
        </div>
      </header>

      <section className="content">
        {tab === 'batches' ? (
          <>
            <div className="hero">
              <div>
                <div className="eyebrow">WELCOME TO PREP MASTER</div>
                <h1>Better Learning<br /><span>Brighter Future.</span></h1>
                <p>Learn smarter with organized batches, notes and lessons.</p>
              </div>
              <img src="/prep-master-icon.png" alt="" />
            </div>
            <div className="search"><span>⌕</span><input placeholder="Search batches..." value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="sectionHeading"><h2>All Batches</h2><span>{filtered.length} available</span></div>
            {loading && <div className="state">Loading batches…</div>}
            {error && !loading && <div className="state error">{error}</div>}
            {!loading && !error && filtered.length === 0 && <div className="state">No batches found.</div>}
            <div className="list">
              {filtered.map(b => <BatchCard key={b.id} b={b} enrolled={enrolledIds.has(String(b.id))} onStudy={openStudy} onEnroll={enroll} />)}
            </div>
          </>
        ) : tab === 'my' ? (
          <MyBatches enrolled={enrolled} onStudy={openStudy} onGoBatches={() => selectTab('batches')} />
        ) : (
          <ComingSoon type={tab} onBack={() => selectTab('batches')} />
        )}
      </section>

      <nav className="bottom" aria-label="Main navigation">
        <button className={tab === 'community' ? 'active' : ''} onClick={() => selectTab('community')}><span>💬</span>Community</button>
        <button className={tab === 'my' ? 'active' : ''} onClick={() => selectTab('my')}><span>📖</span>My Batches</button>
        <button className={tab === 'batches' ? 'active' : ''} onClick={() => selectTab('batches')}><span>▦</span>Batches</button>
        <button className={tab === 'ai' ? 'active' : ''} onClick={() => selectTab('ai')}><span>🤖</span>AI Doubts</button>
      </nav>

      {telegramOpen && (
        <div className="overlay" onClick={() => setTelegramOpen(false)}>
          <div className="modal smallModal" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setTelegramOpen(false)}>×</button>
            <div className="modalIcon">✈️</div>
            <h2>Telegram link not configured</h2>
            <p>Add <b>NEXT_PUBLIC_TELEGRAM_URL</b> in your environment variables to connect your Telegram channel.</p>
          </div>
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            {selected.type === 'success' ? (
              <>
                <div className="successIcon">✓</div>
                <div className="successLabel">Congratulations 🎉</div>
                <h2>You are enrolled!</h2>
                <p><b>{selected.batch.title}</b> has been added to My Batches.</p>
                <button className="modalPrimary" onClick={() => { setSelected(null); setTab('my'); }}>Go to My Batches</button>
              </>
            ) : (
              <>
                <div className="eyebrow">SELECTED BATCH</div>
                <h2>{selected.batch.title}</h2>
                <p>Batch ID: <b>{selected.batch.id}</b></p>
                <p className="muted">This Study button is ready for your batch learning flow. You can connect this batch ID to overview → folders → lectures → video.</p>
                <button className="modalPrimary" onClick={() => setSelected(null)}>Continue</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
