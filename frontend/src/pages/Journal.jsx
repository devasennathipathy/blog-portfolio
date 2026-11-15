import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Asterisk, BookOpen, Circle, Code2, Mail, Search, Sparkles } from 'lucide-react';
import { api, formatDate } from '../lib/api.js';
import { categories } from '../../../shared/posts.js';
import Artwork from '../components/Artwork.jsx';
import { profile } from '../config/profile.js';

function PostMeta({ post }) {
  return <div className="post-meta"><span className={`category-text category-${post.category.toLowerCase()}`}>{post.category}</span><span className="meta-dot">·</span><span>{formatDate(post.publishedAt)}</span><span className="meta-dot">·</span><span>{post.readingTime} min read</span></div>;
}

function Sidebar() {
  return <aside className="journal-sidebar">
    <section className="about-card"><div className="sidebar-eyebrow"><span>ABOUT ME</span><span className="tiny-star">✳</span></div><div className="profile-avatar"><Code2 size={29} strokeWidth={1.5} /><span className="avatar-dot" /></div><h3 className="sidebar-name">{profile.name}</h3><span className="profile-role">{profile.role}</span><p>Engineering graduate, responsive website builder, and full stack learner. I’m looking for my first developer role.</p><Link className="inline-link" to="/about">More about me <ArrowUpRight size={16} /></Link><div className="profile-location"><Circle size={10} fill="currentColor" /> {profile.location}</div></section>
    <section className="exploring-card"><h3><Sparkles size={17} /> Technical focus</h3><ul><li><span className="explore-dot green" />React & responsive interfaces</li><li><span className="explore-dot orange" />Node.js, Express & MongoDB</li><li><span className="explore-dot blue" />AWS cloud fundamentals</li></ul></section>
    <section className="sidebar-note contact-note"><div className="note-icon"><Mail size={24} strokeWidth={1.4} /></div><h3>Contact</h3><p>Available for entry-level MERN stack developer opportunities.</p><a className="inline-link" href={`mailto:${profile.email}`}>Send an email <ArrowUpRight size={15} /></a></section>
    <Link to="/work" className="work-link"><span><span className="eyebrow">SELECTED WORK</span><strong>View projects</strong></span><ArrowUpRight size={23} /></Link>
  </aside>;
}

export default function Journal() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const page = Number(params.get('page')) || 1;
  const [input, setInput] = useState(search);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => { setInput(search); }, [search]);
  useEffect(() => {
    if (input === search) return;
    const timer = setTimeout(() => setParams(previous => { const next = new URLSearchParams(previous); input.trim() ? next.set('search', input.trim()) : next.delete('search'); next.delete('page'); return next; }, { replace: true }), 300);
    return () => clearTimeout(timer);
  }, [input, search, setParams]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const query = new URLSearchParams({ page: String(page), limit: '9' });
    if (category) query.set('category', category);
    if (search) query.set('search', search);
    api(`/posts?${query}`, { signal: controller.signal }).then(setData).catch(err => { if (err.name !== 'AbortError') setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, search, page, retry]);
  const selectCategory = value => setParams(previous => { const next = new URLSearchParams(previous); value ? next.set('category', value) : next.delete('category'); next.delete('page'); return next; });
  const changePage = value => { setParams(previous => { const next = new URLSearchParams(previous); next.set('page', String(value)); return next; }); document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' }); };
  const feature = !category && !search && page === 1 ? data?.posts.find(post => post.featured) : null;
  const posts = data?.posts.filter(post => post.id !== feature?.id) || [];
  return <div className="page-shell">
    <section className="journal-hero"><div><div className="eyebrow hero-eyebrow"><span className="small-line" /> DEVASENNATHIPATHY K</div><h1>MERN Stack Developer.<br /><em>Building web applications.</em></h1><p>I build responsive websites and full stack applications.<br className="desktop-break" /> Explore my projects, technical articles, and development experience.</p></div><div className="hero-side"><Asterisk size={91} strokeWidth={1.1} /><span>FULL STACK DEVELOPMENT</span><p>MongoDB · Express.js<br />React.js · Node.js</p><a href="#journal" aria-label="Browse blog posts"><ArrowDown size={19} /></a></div></section>
    <div className="journal-layout"><section className="journal-main" id="journal">
      <div className="section-heading"><h2>Blog<span className="article-count">{data ? String(data.total).padStart(2, '0') : '—'}</span></h2><span className="section-caption">WEB DEVELOPMENT & TECHNICAL ARTICLES</span></div>
      <div className="journal-toolbar"><div className="category-tabs" aria-label="Filter articles by category">{['', ...categories].map(value => <button key={value} className={category === value ? 'active' : ''} aria-pressed={category === value} onClick={() => selectCategory(value)}>{value || 'All posts'}</button>)}</div><label className="search-field"><Search size={16} /><input aria-label="Search articles" value={input} onChange={e => setInput(e.target.value)} placeholder="Search articles…" maxLength={100} /></label></div>
      {data?.preview && <div className="preview-note"><span className="preview-dot" /> Sample articles <span>·</span> Read-only preview while services are being connected.</div>}
      {error ? <div className="empty-state" role="alert"><BookOpen size={30} /><h3>Unable to load articles.</h3><p>{error}</p><button className="button" onClick={() => setRetry(retry + 1)}>Try again</button></div> : loading ? <div aria-label="Loading articles" role="status" className="loading-posts"><div className="skeleton feature-skeleton" /><div className="skeleton-row"><div className="skeleton" /><div className="skeleton" /></div><span className="sr-only">Loading articles…</span></div> : <>
        {feature && <Link to={`/blog/${feature.slug}`} className="featured-post"><Artwork theme={feature.coverTheme} large /><div className="featured-body"><span className="featured-label"><span /> FEATURED ARTICLE</span><PostMeta post={feature} /><h3>{feature.title}</h3><p>{feature.excerpt}</p><div className="feature-bottom"><span>Read article <ArrowUpRight size={17} /></span><span className="read-circle"><ArrowUpRight size={21} /></span></div></div></Link>}
        {posts.length > 0 ? <div className="post-grid">{posts.map(post => <Link to={`/blog/${post.slug}`} className="post-card" key={post.id}><Artwork theme={post.coverTheme} /><div className="card-body"><PostMeta post={post} /><h3>{post.title}</h3><p>{post.excerpt}</p><span className="card-read">Read article <ArrowUpRight size={16} /></span></div></Link>)}</div> : !feature && <div className="empty-state"><Search size={30} /><h3>{search || category ? 'No articles found.' : 'No published articles.'}</h3><p>{search || category ? 'Try another search or browse all articles.' : 'New articles will appear here when they’re published.'}</p>{(search || category) && <button className="button" onClick={() => { setInput(''); setParams({}); }}>View all articles <ArrowRight size={16} /></button>}</div>}
        {data?.pages > 1 && <nav className="pagination" aria-label="Article pagination"><button className="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button><span>Page {page} of {data.pages}</span><button className="button" disabled={page >= data.pages} onClick={() => changePage(page + 1)}>Next <ArrowRight size={15} /></button></nav>}
        <div className="journal-end"><span /> <p>End of articles</p><span /></div>
      </>}
    </section><Sidebar /></div>
  </div>;
}
