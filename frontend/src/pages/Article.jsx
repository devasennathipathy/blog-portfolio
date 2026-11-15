import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowUpRight, Link2 } from 'lucide-react';
import { api, formatDate } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Artwork from '../components/Artwork.jsx';

export function Markdown({ children }) {
  return <ReactMarkdown components={{ a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>{children}</ReactMarkdown>;
}
export default function Article() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const notify = useToast();
  useEffect(() => {
    const controller = new AbortController();
    setPost(null); setError('');
    api(`/posts/${encodeURIComponent(slug)}`, { signal: controller.signal }).then(setPost).catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [slug]);
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); notify('Article link copied.'); } catch { notify('Couldn’t copy the link. You can copy it from your address bar.', 'error'); } };
  return <div className="article-shell"><Link to="/" className="back-link"><ArrowLeft size={16} /> Back to blog</Link>
    {error ? <div className="empty-state" role="alert"><h1>Article unavailable.</h1><p>{error}</p><Link className="button" to="/">View blog</Link></div> : !post ? <div className="skeleton article-skeleton" role="status" aria-label="Loading article" /> : <article>
      {post.preview && <div className="preview-note"><span className="preview-dot" /> Sample article · Read-only preview</div>}
      <header className="article-header"><span className={`category-pill category-${post.category.toLowerCase()}`}>{post.category}</span><h1>{post.title}</h1><p className="article-excerpt">{post.excerpt}</p><div className="article-byline"><div className="byline-avatar">f.</div><div><strong>{post.author.name}</strong><span>{formatDate(post.publishedAt)} <span>·</span> {post.readingTime} min read</span></div><button className="icon-button" onClick={copyLink} aria-label="Copy article link"><Link2 size={19} /></button></div></header>
      <Artwork theme={post.coverTheme} large /><div className="article-prose"><Markdown>{post.content}</Markdown></div>
      <footer className="article-end"><div className="article-tags">{post.tags.map(tag => <Link key={tag} to={`/?search=${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div><Link to="/" className="inline-link">More articles <ArrowUpRight size={17} /></Link></footer>
    </article>}
  </div>;
}
