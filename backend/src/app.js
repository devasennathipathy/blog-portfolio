import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { escapeRegex, feedSchema, postSchema, publicPost } from './validation.js';
import { samplePosts, readingTime } from '../../shared/posts.js';

const failure = (res, status, message) => res.status(status).json({ error: message });

export function createApp({ db = null, verifyToken = null } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Vercel overwrites X-Forwarded-For before passing a request to this function.
  if (process.env.VERCEL === '1') app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://apis.google.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseio.com', 'https://*.firebaseapp.com', ...(!config.production ? ['http://127.0.0.1:9099', 'http://localhost:9099'] : [])],
    frameSrc: ["'self'", 'https://*.firebaseapp.com'],
    imgSrc: ["'self'", 'data:'],
    upgradeInsecureRequests: config.production ? [] : null,
  } } }));
  app.use(cors({ origin: config.origins }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please try again in a minute.' } }));
  app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

  const requireDatabase = (req, res, next) => db ? next() : failure(res, 503, 'Publishing is unavailable until MongoDB is configured.');
  const authenticate = async (req, res, next) => {
    const match = req.headers.authorization?.match(/^Bearer (\S+)$/);
    if (!match) return failure(res, 401, 'Please sign in to continue.');
    if (!verifyToken) return failure(res, 503, 'Firebase Authentication is not configured.');
    try { req.user = await verifyToken(match[1]); }
    catch { return failure(res, 401, 'Your session has expired or is invalid. Please sign in again.'); }
    next();
  };
  const adminOnly = (req, res, next) => req.user?.admin === true ? next() : failure(res, 403, 'Admin access is required.');
  const writeLimit = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many changes. Please try again in a minute.' } });
  const validId = (req, res, next) => /^[a-f0-9]{24}$/i.test(req.params.id) ? next() : failure(res, 400, 'Invalid post ID.');

  app.get('/api/health', async (req, res) => {
    if (db) await db.command({ ping: 1 });
    res.json({ status: db ? 'ready' : 'preview', database: db ? 'connected' : 'unconfigured', authentication: Boolean(verifyToken) });
  });

  app.get('/api/posts', async (req, res) => {
    const parsed = feedSchema.safeParse(req.query);
    if (!parsed.success) return failure(res, 400, 'Invalid search, category, or pagination.');
    const { page, limit, category, search } = parsed.data;
    if (!db) {
      const matches = samplePosts.filter(p => (!category || p.category === category) && (!search || `${p.title} ${p.excerpt} ${p.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())));
      return res.json({ posts: matches.slice((page - 1) * limit, page * limit).map(({ content, ...p }) => ({ ...p, id: p.slug, author: { name: 'The Fieldnotes author' }, readingTime: readingTime(content) })), total: matches.length, page, pages: Math.ceil(matches.length / limit), preview: true });
    }
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (search) filter.$or = ['title', 'excerpt', 'tags'].map(key => ({ [key]: { $regex: escapeRegex(search), $options: 'i' } }));
    const posts = db.collection('posts');
    const [items, total] = await Promise.all([
      posts.find(filter).sort({ publishedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      posts.countDocuments(filter),
    ]);
    res.json({ posts: items.map(p => { const { content, ...summary } = publicPost(p); return summary; }), total, page, pages: Math.ceil(total / limit), preview: false });
  });

  app.get('/api/posts/:slug', async (req, res) => {
    if (req.params.slug.length > 200) return failure(res, 400, 'Invalid article address.');
    if (!db) {
      const post = samplePosts.find(p => p.slug === req.params.slug);
      return post ? res.json({ ...post, id: post.slug, author: { name: 'The Fieldnotes author' }, readingTime: readingTime(post.content), preview: true }) : failure(res, 404, 'This article could not be found.');
    }
    const post = await db.collection('posts').findOne({ slug: req.params.slug, status: 'published' });
    return post ? res.json(publicPost(post)) : failure(res, 404, 'This article could not be found.');
  });

  app.get('/api/me', authenticate, requireDatabase, async (req, res) => {
    const user = { uid: req.user.uid, email: req.user.email || '', name: req.user.name || 'Reader', role: req.user.admin === true ? 'admin' : 'reader' };
    await db.collection('users').updateOne({ uid: user.uid }, { $set: { ...user, lastSeenAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    res.json(user);
  });

  app.use('/api/admin', authenticate, adminOnly, requireDatabase);
  app.get('/api/admin/posts', async (req, res) => {
    const parsed = feedSchema.safeParse(req.query);
    if (!parsed.success) return failure(res, 400, 'Invalid pagination.');
    const { page, limit } = parsed.data;
    const [posts, total] = await Promise.all([
      db.collection('posts').find().sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      db.collection('posts').countDocuments(),
    ]);
    res.json({ posts: posts.map(publicPost), total, page, pages: Math.ceil(total / limit) });
  });

  app.get('/api/admin/posts/:id', validId, async (req, res) => {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(req.params.id) });
    return post ? res.json(publicPost(post)) : failure(res, 404, 'Post not found.');
  });

  app.post('/api/admin/posts', writeLimit, async (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please check the post fields.', details: parsed.error.flatten().fieldErrors });
    const now = new Date();
    const slugBase = parsed.data.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'article';
    const post = { ...parsed.data, slug: `${slugBase}-${randomUUID().slice(0, 8)}`, author: { uid: req.user.uid, name: req.user.name || 'Fieldnotes author' }, createdAt: now, updatedAt: now, publishedAt: parsed.data.status === 'published' ? now : null };
    const result = await db.collection('posts').insertOne(post);
    res.status(201).json(publicPost({ ...post, _id: result.insertedId }));
  });

  app.put('/api/admin/posts/:id', writeLimit, validId, async (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Please check the post fields.', details: parsed.error.flatten().fieldErrors });
    const _id = new ObjectId(req.params.id);
    const existing = await db.collection('posts').findOne({ _id });
    if (!existing) return failure(res, 404, 'Post not found.');
    const now = new Date();
    const post = await db.collection('posts').findOneAndUpdate({ _id }, { $set: { ...parsed.data, updatedAt: now, publishedAt: parsed.data.status === 'published' ? (existing.publishedAt || now) : existing.publishedAt } }, { returnDocument: 'after' });
    res.json(publicPost(post));
  });

  app.delete('/api/admin/posts/:id', writeLimit, validId, async (req, res) => {
    const { deletedCount } = await db.collection('posts').deleteOne({ _id: new ObjectId(req.params.id) });
    return deletedCount ? res.status(204).end() : failure(res, 404, 'Post not found.');
  });

  app.use('/api', (req, res) => failure(res, 404, 'API route not found.'));

  const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  if (existsSync(dist)) {
    app.use(express.static(dist, { index: false }));
    app.get('/{*path}', (req, res) => res.sendFile(`${dist}/index.html`));
  }
  app.use((error, req, res, next) => {
    if (error.type === 'entity.too.large') return failure(res, 413, 'This request is too large.');
    if (error.type === 'entity.parse.failed') return failure(res, 400, 'Invalid JSON request.');
    if (error.code === 11000) return failure(res, 409, 'A record with this identifier already exists.');
    console.error('Request failed:', error.name);
    failure(res, 500, 'Something went wrong. Please try again.');
  });
  return app;
}
