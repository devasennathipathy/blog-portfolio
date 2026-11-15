import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, formatDate } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import AdminGate from '../components/AdminGate.jsx';
import Modal from '../components/Modal.jsx';
import Artwork from '../components/Artwork.jsx';

function Dashboard() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    api(`/admin/posts?page=${page}&limit=12`, { authenticated: true, signal: controller.signal }).then(setData).catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [page, refresh]);
  const deletePost = async () => {
    setBusy(true);
    try {
      await api(`/admin/posts/${deleting.id}`, { authenticated: true, method: 'DELETE' });
      setDeleting(null); notify('Post deleted.');
      if (data.posts.length === 1 && page > 1) setPage(page - 1);
      else setRefresh(refresh + 1);
    } catch (err) { notify(err.message, 'error'); }
    finally { setBusy(false); }
  };
  return <div className="page-shell admin-shell"><div className="page-heading"><div><span className="eyebrow">CONTENT MANAGEMENT</span><h1>Admin dashboard</h1><p>Create, edit, and publish blog posts.</p></div><Link className="button dark" to="/admin/new"><Plus size={18} /> Create post</Link></div>
    <div className="admin-banner"><span className="admin-banner-icon"><FileText size={24} /></span><div><strong>Manage blog content</strong><p>Drafts are visible only to administrators until published.</p></div><span className="admin-count">{data?.total ?? '—'}<small>TOTAL POSTS</small></span></div>
    <div className="section-heading"><h2>All posts</h2><span className="section-caption">MOST RECENTLY UPDATED</span></div>
    {error ? <div className="empty-state" role="alert"><h3>Unable to load posts.</h3><p>{error}</p><button className="button" onClick={() => setRefresh(refresh + 1)}>Try again</button></div> : !data ? <div className="skeleton admin-skeleton" aria-label="Loading posts" role="status" /> : data.posts.length === 0 ? <div className="empty-state"><BookOpen size={31} /><h3>No posts yet.</h3><p>Create your first blog post to get started.</p><Link className="button dark" to="/admin/new"><Plus size={17} /> Create your first post</Link></div> : <><div className="admin-list">{data.posts.map(post => <div className="admin-row" key={post.id}><div className="admin-thumbnail"><Artwork theme={post.coverTheme} /></div><div className="admin-post-info"><span className={`status-pill status-${post.status}`}>{post.status}</span><h3><Link to={`/admin/edit/${post.id}`}>{post.title}</Link></h3><p>{post.category} <span>·</span> Updated {formatDate(post.updatedAt)}</p></div><div className="row-actions">{post.status === 'published' && <Link className="icon-button" aria-label={`View ${post.title}`} to={`/blog/${post.slug}`}><ArrowUpRight size={18} /></Link>}<Link className="icon-button" aria-label={`Edit ${post.title}`} to={`/admin/edit/${post.id}`}><Pencil size={17} /></Link><button className="icon-button delete-button" aria-label={`Delete ${post.title}`} onClick={() => setDeleting(post)}><Trash2 size={17} /></button></div></div>)}</div>{data.pages > 1 && <div className="pagination"><button className="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {data.pages}</span><button className="button" disabled={page === data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}</>}
    {deleting && <Modal title="Delete this post?" onClose={() => { if (!busy) setDeleting(null); }}><p className="muted">“{deleting.title}” will be permanently deleted. This action cannot be undone.</p><div className="modal-actions"><button className="button" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button><button className="button danger" disabled={busy} onClick={deletePost}>{busy ? 'Deleting…' : 'Delete post'}</button></div></Modal>}
  </div>;
}
export default function Admin({ openAuth }) { return <AdminGate openAuth={openAuth}><Dashboard /></AdminGate>; }
