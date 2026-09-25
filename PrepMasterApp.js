'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pm_enrolled';
const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/prepmaster0';
const OWNER_CONTACT = process.env.NEXT_PUBLIC_OWNER_CONTACT || 'https://t.me/Subhanali011';

function cleanText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return String(value);
}

function first(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) if (obj[key] != null && obj[key] !== '') return obj[key];
  return fallback;
}

function findArrays(value, depth = 0) {
  if (depth > 4 || value == null) return [];
  if (Array.isArray(value)) return [value, ...value.flatMap(v => findArrays(v, depth + 1))];
  if (typeof value === 'object') return Object.values(value).flatMap(v => findArrays(v, depth + 1));
  return [];
}

function normalizeItems(data) {
  const arrays = findArrays(data);
  const source = arrays.find(a => a.some(x => x && typeof x === 'object' && ['folder_id','folderId','content_id','contentId','lecture_id','lectureId','video_url','videoUrl','type'].some(k => k in x))) || arrays.find(a => a.length) || [];
  return source.filter(Boolean).map((x, i) => {
    if (typeof x !== 'object') return { id: String(i), title: String(x), kind: 'item' };
    const id = first(x, ['id','folder_id','folderId','content_id','contentId','lecture_id','lectureId'], i);
    const title = cleanText(first(x, ['title','name','folder_name','folderName','content_name','contentName','lecture_name','lectureName'], `Item ${i + 1}`));
    const type = String(first(x, ['type','content_type','contentType','kind'], '')).toLowerCase();
    const url = first(x, ['video_url','videoUrl','hls_url','hlsUrl','play_url','playUrl','url','pdf_url','pdfUrl'], '');
    const looksFolder = /folder|directory|subject|chapter/.test(type) || x.folder_id != null || x.folderId != null;
    return { ...x, id:String(id), title, kind: looksFolder ? 'folder' : (url ? 'media' : 'item'), url };
  });
}

function date(v) {
  if (!v) return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const d = new Date(n > 1e10 ? n : n * 1000);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }

function BatchCard({ b, enrolled, onStudy, onEnroll }) {
  const p = Number(b.offer_price);
  const price = Number.isFinite(p) && p === 0 ? 'FREE' : (b.price || 'FREE');
  return <article className="card">
    <div className="pic">{b.thumbnail ? <img src={b.thumbnail} alt={b.title} /> : <div className="placeholder">PREP MASTER</div>}{b.is_new ? <span className="new">NEW</span> : null}<span className="freeBadge">{String(price).toUpperCase()==='FREE'?'FREE':`₹${price}`}</span></div>
    <div className="body"><h2>{b.title}</h2>{b.description ? <div className="desc">{cleanText(b.description)}</div> : null}{(b.start_date||b.end_date) ? <div className="meta"><Icon>◷</Icon><span>{b.start_date&&`Starts ${date(b.start_date)}`}{b.start_date&&b.end_date?' | ':''}{b.end_date&&`Ends ${date(b.end_date)}`}</span></div>:null}<div className="priceLine"><b>{String(price).toUpperCase()==='FREE'?'FREE':`₹${price}`}</b><span>{enrolled?'Enrolled':'Available for Students'}</span></div><div className="actions"><button onClick={()=>onEnroll(b)} className={enrolled?'enrolled':'enroll'} disabled={enrolled}><Icon>{enrolled?'✓':'+'}</Icon>{enrolled?'ENROLLED':'ENROLL'}</button><button onClick={()=>onStudy(b)} className="study">LET&apos;S STUDY <span>→</span></button></div></div>
  </article>;
}

function LearningView({ batch, onBack }) {
  const [path, setPath] = useState([{ id:'0', title:'All Content' }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(null);

  const courseId = first(batch, ['id','course_id','courseId','batch_id','batchId']);
  const currentFolder = path[path.length-1].id;

  async function loadFolder(folderId) {
    setLoading(true); setError('');
    try {
      const url = folderId === '0' ? `/api/content?content=${encodeURIComponent(courseId)}&folder=0` : `/api/content?content=${encodeURIComponent(courseId)}&folder=${encodeURIComponent(folderId)}`;
      const res = await fetch(url, { cache:'no-store' });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || 'Unable to load content');
      setItems(normalizeItems(j.data));
    } catch(e) { setError(e.message); setItems([]); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ loadFolder(currentFolder); }, [courseId, currentFolder]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openItem(item) {
    if (item.kind === 'folder') { setPath(p=>[...p,{id:item.id,title:item.title}]); return; }
    if (item.url) { setPlaying({ title:item.title, url:item.url, direct:true }); return; }
    const contentId = first(item, ['content_id','contentId','lecture_id','lectureId','id']);
    if (!contentId) return;
    try {
      const res = await fetch(`/api/playback?content_id=${encodeURIComponent(contentId)}&course_id=${encodeURIComponent(courseId)}`, {cache:'no-store'});
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || 'Unable to load playback');
      const text = JSON.stringify(j.data);
      const match = text.match(/https?:[^"\\]+\.m3u8[^"\\]*/i) || text.match(/https?:[^"\\]+\.mp4[^"\\]*/i) || text.match(/https?:[^"\\]+\.pdf[^"\\]*/i);
      setPlaying({ title:item.title, url:match?.[0] || '', raw:j.data });
    } catch(e) { setError(e.message); }
  }

  return <section className="pagePanel learning"><button className="backBtn" onClick={onBack}>← <span>Back</span></button><div className="learningHead"><div><div className="eyebrow">NOW STUDYING</div><h1>{batch.title}</h1></div></div><div className="breadcrumbs">{path.map((p,i)=><span key={p.id}>{i>0?' / ':''}<button onClick={()=>setPath(path.slice(0,i+1))}>{p.title}</button></span>)}</div>{loading&&<div className="state">Loading content…</div>}{error&&<div className="state error">{error}<button className="retry" onClick={()=>loadFolder(currentFolder)}>Retry</button></div>}{!loading&&!error&&!items.length&&<div className="state">No content found in this folder.</div>}<div className="contentGrid">{items.map((item,i)=><button className="contentItem" key={`${item.id}-${i}`} onClick={()=>openItem(item)}><span className="contentIcon">{item.kind==='folder'?'📁':item.kind==='media'?'▶':'📄'}</span><span><b>{item.title}</b><small>{item.kind==='folder'?'Open folder':item.kind==='media'?'Open lesson':'Open content'}</small></span><strong>›</strong></button>)}</div>{playing&&<div className="playerCard"><div className="playerTitle"><b>{playing.title}</b><button onClick={()=>setPlaying(null)}>×</button></div>{playing.url?.includes('.pdf')?<iframe title={playing.title} src={playing.url} />:playing.url?<video controls playsInline src={playing.url} />:<div className="state">Playback data was received, but no direct media URL was found. Check the API response for this lesson.</div>}</div>}</section>;
}

function MyBatches({ enrolled,onStudy,onGoBatches }) { return <section className="pagePanel"><div className="pageTitleRow"><div><div className="eyebrow">YOUR LEARNING</div><h1>My Batches</h1></div><span className="countBadge">{enrolled.length}</span></div>{!enrolled.length?<div className="emptyCard"><div className="emptyIcon">📚</div><h2>No enrolled batches yet</h2><p>Enroll in a batch and it will appear here.</p><button onClick={onGoBatches}>Browse Batches</button></div>:<div className="myList">{enrolled.map(b=><article className="myCard" key={b.id}><div className="myThumb">{b.thumbnail?<img src={b.thumbnail} alt=""/>:<span>PM</span>}</div><div className="myInfo"><h2>{b.title}</h2><div className="progressLabel"><span>Enrolled</span><span>Ready to study</span></div><div className="progress"><i/></div></div><button onClick={()=>onStudy(b)} className="miniStudy">Study →</button></article>)}</div>}</section>; }
function ComingSoon({type,onBack}){return <section className="pagePanel"><button className="backBtn" onClick={onBack}>← <span>Back</span></button><div className="comingSoon"><div className="comingIcon">{type==='community'?'💬':'🤖'}</div><h1>This feature is coming soon</h1><p>{type==='community'?'Community chat will be available in a future update.':'AI Doubts support will be available in a future update.'}</p></div></section>}

export default function PrepMasterApp(){
  const [tab,setTab]=useState('batches'); const [batches,setBatches]=useState([]); const [enrolled,setEnrolled]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [q,setQ]=useState(''); const [selected,setSelected]=useState(null); const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{try{const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(Array.isArray(s))setEnrolled(s)}catch{}},[]);
  useEffect(()=>{fetch('/api/batches',{cache:'no-store'}).then(async r=>{const j=await r.json();if(!r.ok||!j.success)throw Error(j.error||'Unable to load batches');setBatches(j.batches||[])}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  const enrolledIds=useMemo(()=>new Set(enrolled.map(b=>String(b.id))),[enrolled]); const filtered=useMemo(()=>{const s=q.toLowerCase().trim();return s?batches.filter(b=>(b.title+' '+cleanText(b.description)).toLowerCase().includes(s)):batches},[batches,q]);
  const saveEnrolled=next=>{setEnrolled(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next))};
  const enroll=b=>{if(enrolledIds.has(String(b.id)))return;saveEnrolled([...enrolled,b]);setSelected({type:'success',batch:b})};
  const openStudy=b=>setSelected({type:'learning',batch:b});
  const selectTab=n=>{setTab(n);setMenuOpen(false)};
  return <main className="shell"><header className="top"><div className="brand" onClick={()=>selectTab('batches')} role="button" tabIndex={0}><img src="/prep-master-logo.png" alt="Prep Master" className="brandLogo"/><div className="brandText"><strong>Prep <span>Master</span></strong><small>LEARN • PRACTICE • GROW</small></div></div><div className="menuWrap"><button className="dots" aria-label="Open menu" onClick={()=>setMenuOpen(v=>!v)}>⋮</button>{menuOpen&&<><button className="menuBackdrop" aria-label="Close menu" onClick={()=>setMenuOpen(false)}/><div className="menu"><button onClick={()=>selectTab('batches')}><Icon>📚</Icon><span>Batches</span></button><button onClick={()=>selectTab('my')}><Icon>📖</Icon><span>My Batches</span></button><button onClick={()=>{setMenuOpen(false);window.open(TELEGRAM_URL,'_blank','noopener,noreferrer')}}><Icon>✈️</Icon><span>Join Telegram</span></button><button onClick={()=>{setMenuOpen(false);window.open(OWNER_CONTACT,'_blank','noopener,noreferrer')}}><Icon>👤</Icon><span>Contact Owner</span></button></div></>}</div></header>
  <section className="content">{tab==='batches'?<><div className="hero"><div><div className="eyebrow">WELCOME TO PREP MASTER</div><h1>Better Learning<br/><span>Brighter Future.</span></h1><p>Learn smarter with organized batches, folders, lessons and study material.</p></div><img src="/prep-master-icon.png" alt=""/></div><div className="search"><span>⌕</span><input placeholder="Search batches..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="sectionHeading"><h2>All Batches</h2><span>{filtered.length} available</span></div>{loading&&<div className="state">Loading batches…</div>}{error&&!loading&&<div className="state error">{error}<button className="retry" onClick={()=>location.reload()}>Retry</button></div>}{!loading&&!error&&!filtered.length&&<div className="state">No batches found.</div>}<div className="list">{filtered.map(b=><BatchCard key={b.id} b={b} enrolled={enrolledIds.has(String(b.id))} onStudy={openStudy} onEnroll={enroll}/>)}</div></>:tab==='my'?<MyBatches enrolled={enrolled} onStudy={openStudy} onGoBatches={()=>selectTab('batches')}/>:<ComingSoon type={tab} onBack={()=>selectTab('batches')}/>}</section>
  <nav className="bottom"><button className={tab==='community'?'active':''} onClick={()=>selectTab('community')}><span>💬</span>Community</button><button className={tab==='my'?'active':''} onClick={()=>selectTab('my')}><span>📖</span>My Batches</button><button className={tab==='batches'?'active':''} onClick={()=>selectTab('batches')}><span>📚</span>Batches</button><button className={tab==='ai'?'active':''} onClick={()=>selectTab('ai')}><span>🤖</span>AI Doubts</button></nav>
  {selected&&<div className="overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>{selected.type==='learning'?<LearningView batch={selected.batch} onBack={()=>setSelected(null)}/>:<><button className="close" onClick={()=>setSelected(null)}>×</button><div className="successIcon">✓</div><div className="successLabel">Congratulations 🎉</div><h2>You are enrolled!</h2><p><b>{selected.batch.title}</b> has been added to My Batches.</p><button className="modalPrimary" onClick={()=>{setSelected(null);setTab('my')}}>Go to My Batches</button></>}</div></div>}
  </main>;
}
