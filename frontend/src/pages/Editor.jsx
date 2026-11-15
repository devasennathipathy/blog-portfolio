import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Eye, Pencil, Save } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { categories, coverThemes } from '../../../shared/posts.js';
import AdminGate from '../components/AdminGate.jsx';
import Artwork from '../components/Artwork.jsx';
import { Markdown } from './Article.jsx';

const emptyPost = { title: '', excerpt: '', content: '', category: 'Development', tags: [], coverTheme: 'green', status: 'draft', featured: false };

function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [post, setPost] = useState(emptyPost);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!id) { setPost(emptyPost); setTags(''); setLoading(false); setDirty(false); return; }
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    api(`/admin/posts/${id}`, { authenticated: true, signal: controller.signal }).then(data => {
      const fields = Object.fromEntries(Object.keys(emptyPost).map(key => [key, data[key]]));
      setPost(fields); setTags(data.tags.join(', ')); setDirty(false);
    }).catch(err => { if (err.name !== 'AbortError') setLoadError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    const handler = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const update = (key, value) => { setPost(prev => ({ ...prev, [key]: value })); setDirty(true); };
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    const tagList = [...new Set(tags.split(',').map(t => t.trim()).filter(Boolean))];
    try {
      await api(id ? `/admin/posts/${id}` : '/admin/posts', { authenticated: true, method: id ? 'PUT' : 'POST', body: JSON.stringify({ ...post, tags: tagList }) });
      setDirty(false); notify(post.status === 'published' ? 'Post published successfully.' : 'Draft saved successfully.'); navigate('/admin');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <div className="page-shell editor-shell"><Link className="back-link" to="/admin" onClick={event => { if (dirty && !window.confirm('Leave this page? Your unsaved changes will be lost.')) event.preventDefault(); }}><ArrowLeft size={16} /> Back to posts</Link>
    <div className="page-heading"><div><span className="eyebrow">{id ? 'EDIT POST' : 'NEW POST'}</span><h1>{id ? 'Edit post' : 'Create post'}</h1><p>{dirty ? 'You have unsaved changes.' : 'Write your article and choose its publication status.'}</p></div></div>
    {loading ? <div className="skeleton admin-skeleton" role="status" aria-label="Loading editor" /> : loadError ? <div className="empty-state" role="alert"><h3>Unable to load this post.</h3><p>{loadError}</p><Link className="button" to="/admin">Back to all posts</Link></div> : <form className="editor-layout" onSubmit={save}>
      <div className="editor-main form-stack"><label>Title<input autoComplete="off" name="title" required minLength={3} maxLength={160} placeholder="Enter post title" className="title-input" value={post.title} onChange={e => update('title', e.target.value)} /></label><label>Excerpt<textarea name="excerpt" required minLength={10} maxLength={350} rows={3} placeholder="A short summary for the article listing." value={post.excerpt} onChange={e => update('excerpt', e.target.value)} /><span className="field-hint">{post.excerpt.length}/350 characters</span></label>
        <div className="editor-body-heading"><label htmlFor="post-content">Content</label><div className="editor-mode"><button type="button" className={!preview ? 'active' : ''} onClick={() => setPreview(false)}><Pencil size={13} /> Write</button><button type="button" className={preview ? 'active' : ''} onClick={() => setPreview(true)}><Eye size={14} /> Preview</button></div></div>
        <textarea id="post-content" name="content" className={`content-input ${preview ? 'hidden' : ''}`} required={!preview} minLength={preview ? undefined : 50} maxLength={50000} rows={22} placeholder="Write your article in Markdown." value={post.content} onChange={e => update('content', e.target.value)} />
        {preview && <div className="markdown-preview article-prose">{post.content ? <Markdown>{post.content}</Markdown> : <p className="muted">The formatted article preview appears here.</p>}</div>}
        <span className="field-hint">Markdown supported · Minimum 50 characters · {post.content.length.toLocaleString()} characters</span>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div><aside className="editor-options"><section className="editor-panel"><h3>Post settings</h3><div className="form-stack"><label>Category<select value={post.category} onChange={e => update('category', e.target.value)}>{categories.map(cat => <option key={cat}>{cat}</option>)}</select></label><label>Tags<input value={tags} onChange={e => { setTags(e.target.value); setDirty(true); }} placeholder="React, Learning, Ideas" maxLength={190} /><span className="field-hint">Up to 6 tags, separated by commas. 30 characters per tag.</span></label><label>Publish status<select value={post.status} onChange={e => update('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></label><label className="checkbox-label"><input type="checkbox" checked={post.featured} onChange={e => update('featured', e.target.checked)} /> Featured article</label></div></section>
        <section className="editor-panel"><h3>Cover artwork</h3><Artwork theme={post.coverTheme} /><div className="theme-choices" aria-label="Cover artwork">{coverThemes.map(theme => <button className={`theme-choice theme-${theme}`} type="button" key={theme} aria-label={`${theme} cover`} aria-pressed={post.coverTheme === theme} onClick={() => update('coverTheme', theme)}>{post.coverTheme === theme && <Check size={15} />}</button>)}</div></section>
        <button className="button dark full" disabled={saving} type="submit"><Save size={16} />{saving ? 'Saving post…' : post.status === 'published' ? 'Save & publish' : 'Save draft'}</button><p className="publish-hint">{post.status === 'published' ? 'Published posts are visible to everyone.' : 'Drafts are visible only to administrators.'}</p>
      </aside>
    </form>}
  </div>;
}
export default function Editor({ openAuth }) { return <AdminGate openAuth={openAuth}><PostEditor /></AdminGate>; }
