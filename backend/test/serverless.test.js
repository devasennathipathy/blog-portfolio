import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createServerlessHandler } from '../src/serverless.js';
import { createApp } from '../src/app.js';

test('serverless requests share initialization and preserve API route paths', async () => {
  let initializations = 0;
  const handler = createServerlessHandler({ initialize: async () => {
    initializations++;
    await new Promise(resolve => setTimeout(resolve, 20));
    return createApp();
  } });
  const responses = await Promise.all(Array.from({ length: 5 }, () => request(handler).get('/api/health')));
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(initializations, 1);
  const posts = await request(handler).get('/api/posts').expect(200);
  assert.ok(posts.body.total > 0);
  await request(handler).post('/api/admin/posts').expect(401);
});

test('serverless initialization failures return a safe error and retry on the next request', async () => {
  let attempts = 0;
  const handler = createServerlessHandler({ initialize: async () => {
    if (++attempts === 1) throw new Error('An internal connection detail that must not be exposed');
    return createApp();
  } });
  const failed = await request(handler).get('/api/health').expect(503);
  assert.equal(failed.body.error, 'The service is temporarily unavailable. Please try again later.');
  assert.equal(failed.headers['cache-control'], 'no-store');
  await request(handler).get('/api/health').expect(200);
  assert.equal(attempts, 2);
});
