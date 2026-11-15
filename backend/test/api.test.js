import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { connectDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';

let mongo, client, db, app;
const payload = {
  title: 'A small useful idea', excerpt: 'A short introduction to a useful idea.',
  content: 'This is a thoughtful article with enough detail to help the reader understand the example.',
  category: 'Development', tags: ['React', 'Notes'], coverTheme: 'green', status: 'draft', featured: false,
};
const admin = { uid: 'admin-uid', name: 'Test Author', email: 'admin@example.test', admin: true };
const reader = { uid: 'reader-uid', name: 'Test Reader', email: 'reader@example.test' };

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: fileURLToPath(new URL('../../.data/binaries', import.meta.url)) } });
  ({ client, db } = await connectDatabase(mongo.getUri(), 'fieldnotes_test'));
  app = createApp({ db, verifyToken: async token => {
    if (token === 'valid-admin') return admin;
    if (token === 'valid-reader') return reader;
    throw new Error('Invalid or revoked ID token');
  } });
});
beforeEach(async () => { await db.collection('posts').deleteMany({}); await db.collection('users').deleteMany({}); });
after(async () => { await client?.close(); await mongo?.stop(); });

const authorized = (method, path, token = 'valid-admin') => request(app)[method](path).set('Authorization', `Bearer ${token}`);
const add = (fields = {}) => authorized('post', '/api/admin/posts').send({ ...payload, ...fields });

test('health verifies the database connection', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.database, 'connected');
  assert.equal(response.body.authentication, true);
});

test('every admin endpoint rejects anonymous visitors', async () => {
  const id = '0123456789abcdef01234567';
  for (const [method, path] of [['get', '/api/admin/posts'], ['get', `/api/admin/posts/${id}`], ['post', '/api/admin/posts'], ['put', `/api/admin/posts/${id}`], ['delete', `/api/admin/posts/${id}`]]) {
    await request(app)[method](path).send(payload).expect(401);
  }
  assert.equal(await db.collection('posts').countDocuments(), 0);
});

test('valid readers cannot read private posts or perform any admin action', async () => {
  const { body: post } = await add();
  for (const [method, path] of [['get', '/api/admin/posts'], ['get', `/api/admin/posts/${post.id}`], ['post', '/api/admin/posts'], ['put', `/api/admin/posts/${post.id}`], ['delete', `/api/admin/posts/${post.id}`]]) {
    await authorized(method, path, 'valid-reader').set('X-Role', 'admin').send(payload).expect(403);
  }
  assert.equal(await db.collection('posts').countDocuments(), 1);
});

test('expired, forged, and malformed bearer tokens are rejected', async () => {
  for (const value of ['Bearer invalid', 'Bearer valid-admin extra', 'Basic valid-admin', 'Bearer']) {
    await request(app).get('/api/admin/posts').set('Authorization', value).expect(401);
  }
});

test('admin can create, view, edit, publish, unpublish, and delete a persistent post', async () => {
  const { body: draft } = await add().expect(201);
  assert.equal(draft.author.uid, admin.uid);
  assert.equal(draft.status, 'draft');
  assert.equal(draft.publishedAt, null);
  assert.equal(await db.collection('posts').countDocuments(), 1);
  await request(app).get(`/api/posts/${draft.slug}`).expect(404);
  await authorized('get', `/api/admin/posts/${draft.id}`).expect(200);
  const { body: published } = await authorized('put', `/api/admin/posts/${draft.id}`).send({ ...payload, title: 'An edited useful idea', status: 'published' }).expect(200);
  assert.equal(published.slug, draft.slug);
  assert.equal(published.author.uid, admin.uid);
  assert.ok(published.publishedAt);
  const { body: visible } = await request(app).get(`/api/posts/${draft.slug}`).expect(200);
  assert.equal(visible.title, 'An edited useful idea');
  assert.equal(visible.content, payload.content);
  await authorized('put', `/api/admin/posts/${draft.id}`).send(payload).expect(200);
  await request(app).get(`/api/posts/${draft.slug}`).expect(404);
  await authorized('delete', `/api/admin/posts/${draft.id}`).expect(204);
  await authorized('get', `/api/admin/posts/${draft.id}`).expect(404);
  assert.equal(await db.collection('posts').countDocuments(), 0);
});

test('drafts stay hidden from public feed, filters, search, and direct URLs', async () => {
  const { body: draft } = await add({ title: 'Secret draft about React' });
  await add({ status: 'published', title: 'Public React note' });
  for (const query of ['', '?category=Development', '?search=React', '?search=Secret']) {
    const { body } = await request(app).get(`/api/posts${query}`).expect(200);
    assert.ok(body.posts.every(post => post.status === 'published'));
    assert.ok(body.posts.every(post => post.id !== draft.id));
    assert.ok(body.posts.every(post => post.content === undefined));
  }
  await request(app).get(`/api/posts/${draft.slug}`).expect(404);
});

test('validation rejects invalid posts and attempts to inject trusted fields', async () => {
  for (const fields of [{ title: 'x' }, { content: 'short' }, { status: 'admin' }, { category: 'Other' }, { author: { uid: 'attacker' } }, { admin: true }, { tags: Array(7).fill('tag') }]) {
    await add(fields).expect(400);
  }
  assert.equal(await db.collection('posts').countDocuments(), 0);
});

test('search treats regular expression syntax as literal text and filters categories', async () => {
  await add({ title: 'A React (notes) article', status: 'published' });
  await add({ title: 'A design article', category: 'Design', status: 'published' });
  const literal = await request(app).get('/api/posts').query({ search: '(notes)' }).expect(200);
  assert.equal(literal.body.total, 1);
  const allRegex = await request(app).get('/api/posts').query({ search: '.*' }).expect(200);
  assert.equal(allRegex.body.total, 0);
  const design = await request(app).get('/api/posts?category=Design').expect(200);
  assert.equal(design.body.posts[0].title, 'A design article');
});

test('pagination limits are enforced and page counts are correct', async () => {
  await add({ status: 'published' }); await add({ status: 'published' });
  const response = await request(app).get('/api/posts?page=2&limit=1').expect(200);
  assert.equal(response.body.posts.length, 1);
  assert.equal(response.body.pages, 2);
  for (const query of ['?limit=1000', '?page=-1', '?page=abc', '?category=Unknown', '?search[x]=hello']) await request(app).get(`/api/posts${query}`).expect(400);
});

test('duplicate titles get distinct stable slugs', async () => {
  const one = await add(); const two = await add();
  assert.notEqual(one.body.slug, two.body.slug);
});

test('user profiles are upserted without passwords or client-controlled roles', async () => {
  await authorized('get', '/api/me', 'valid-reader').expect(200);
  await authorized('get', '/api/me', 'valid-reader').expect(200);
  const profiles = await db.collection('users').find().toArray();
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].role, 'reader');
  assert.equal(profiles[0].password, undefined);
  assert.equal(profiles[0].uid, reader.uid);
});

test('malformed IDs and missing posts give useful errors', async () => {
  await authorized('get', '/api/admin/posts/not-an-id').expect(400);
  await authorized('delete', '/api/admin/posts/0123456789abcdef01234567').expect(404);
  await request(app).get('/api/not-a-route').expect(404);
});

test('unconfigured preview permits reading and fails closed for publishing', async () => {
  const preview = createApp();
  const feed = await request(preview).get('/api/posts').expect(200);
  assert.equal(feed.body.preview, true);
  assert.ok(feed.body.total > 0);
  await request(preview).get('/api/admin/posts').expect(401);
  await request(preview).get('/api/admin/posts').set('Authorization', 'Bearer forged').expect(503);
});

test('starter migration preserves original posts, imports private drafts, and is repeatable', async () => {
  const source = client.db('starter_migration_test').collection('blogs');
  await source.insertMany([
    { newTitle: 'An original starter post', newContent: 'This content was originally stored using the mentor starter schema.', date: 'October 14, 2026', likes: 7 },
    { newTitle: '', newContent: '' },
  ]);
  const script = fileURLToPath(new URL('../scripts/migrate-starter.js', import.meta.url));
  const env = { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DB: 'fieldnotes_test', STARTER_MONGODB_DB: 'starter_migration_test' };
  await promisify(execFile)(process.execPath, [script], { env, windowsHide: true });
  await promisify(execFile)(process.execPath, [script], { env, windowsHide: true });
  const posts = await db.collection('posts').find().toArray();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].title, 'An original starter post');
  assert.equal(posts[0].likes, 7);
  assert.equal(posts[0].status, 'draft');
  assert.equal(await source.countDocuments(), 2);
  const feed = await request(app).get('/api/posts').expect(200);
  assert.equal(feed.body.total, 0);
  await request(app).get(`/api/posts/${posts[0].slug}`).expect(404);
});
