import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { connectDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';

test('real Firebase signup, login, token verification, admin claim, and disabled-account protection', { skip: !process.env.FIREBASE_AUTH_EMULATOR_HOST }, async () => {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/, 'Integration tests may only target a local emulator.');
  const firebase = initializeApp({ projectId: 'demo-fieldnotes' }, 'integration-tests');
  const auth = getAuth(firebase);
  let mongo, client, uid;
  try {
    mongo = await MongoMemoryServer.create({ binary: { downloadDir: fileURLToPath(new URL('../../.data/binaries', import.meta.url)) } });
    const connection = await connectDatabase(mongo.getUri(), 'firebase_integration');
    client = connection.client;
    const app = createApp({ db: connection.db, verifyToken: token => auth.verifyIdToken(token, true) });
    const email = `reader-${Date.now()}@example.test`;
    const identity = async (action, body) => {
      const response = await fetch(`http://${host}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=demo-key`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, returnSecureToken: true }) });
      return { status: response.status, data: await response.json() };
    };
    const signup = await identity('signUp', { email, password: 'StrongPassword123!' });
    assert.equal(signup.status, 200);
    uid = signup.data.localId;
    await request(app).get('/api/me').set('Authorization', `Bearer ${signup.data.idToken}`).expect(200);
    await request(app).get('/api/admin/posts').set('Authorization', `Bearer ${signup.data.idToken}`).expect(403);
    const wrong = await identity('signInWithPassword', { email, password: 'WrongPassword123!' });
    assert.equal(wrong.status, 400);
    const adminScript = fileURLToPath(new URL('../scripts/admin.js', import.meta.url));
    const runAdminScript = action => promisify(execFile)(process.execPath, [adminScript, email, action], { env: { ...process.env, FIREBASE_PROJECT_ID: 'demo-fieldnotes' }, windowsHide: true });
    await runAdminScript('grant');
    const login = await identity('signInWithPassword', { email, password: 'StrongPassword123!' });
    assert.equal(login.status, 200);
    const token = login.data.idToken;
    await request(app).get('/api/admin/posts').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).post('/api/admin/posts').set('Authorization', `Bearer ${token}`).send({ title: 'Firebase protected story', excerpt: 'An article created by a verified Firebase administrator.', content: 'This article was saved to a real MongoDB database using a real Firebase Authentication Emulator ID token.', category: 'Development', status: 'published' }).expect(201);
    await runAdminScript('revoke');
    const readerLogin = await identity('signInWithPassword', { email, password: 'StrongPassword123!' });
    await request(app).get('/api/admin/posts').set('Authorization', `Bearer ${readerLogin.data.idToken}`).expect(403);
    await auth.updateUser(uid, { disabled: true });
    await request(app).get('/api/admin/posts').set('Authorization', `Bearer ${token}`).expect(401);
    await request(app).get('/api/admin/posts').set('Authorization', 'Bearer completely-forged').expect(401);
  } finally {
    if (uid) await auth.deleteUser(uid);
    await client?.close(); await mongo?.stop(); await deleteApp(firebase);
  }
});
