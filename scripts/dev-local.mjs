import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import net from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { samplePosts } from '../shared/posts.js';

if (process.env.NODE_ENV === 'production') throw new Error('dev:local is only for local development.');
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const localData = resolve(root, '.data');
const firebaseCli = require.resolve('firebase-tools/lib/bin/firebase.js');
const children = [];
let mongo;
let stopping = false;
const env = {
  ...process.env, NODE_ENV: 'development', CI: 'true', DEBUG: '',
  FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  XDG_CONFIG_HOME: resolve(localData, 'config'),
  FIREBASE_EMULATORS_PATH: resolve(localData, 'emulators'),
  FIREBASE_PROJECT_ID: 'demo-fieldnotes', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  MONGODB_DB: 'fieldnotes_local',
  PORT: '4000', CLIENT_ORIGIN: 'http://127.0.0.1:5173,http://localhost:5173',
  VITE_API_URL: '', VITE_FIREBASE_API_KEY: 'demo-fieldnotes-key',
  VITE_FIREBASE_PROJECT_ID: 'demo-fieldnotes',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-fieldnotes.firebaseapp.com',
  VITE_FIREBASE_APP_ID: 'demo-fieldnotes-app',
  VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
};

function start(script, args) {
  const child = spawn(process.execPath, [script, ...args], { cwd: root, env, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', error => { console.error(error.message); shutdown(1); });
  child.on('exit', code => { if (!stopping) { console.error(`A local service stopped (exit ${code}).`); shutdown(code || 1); } });
  return child;
}
async function portOpen(port) {
  return new Promise(resolvePort => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => { socket.destroy(); resolvePort(true); });
    socket.once('error', () => { socket.destroy(); resolvePort(false); });
  });
}
async function waitFor(port) {
  const until = Date.now() + 120000;
  while (Date.now() < until && !stopping) {
    if (await portOpen(port)) return;
    await new Promise(r => setTimeout(r, 400));
  }
  throw new Error(`Local service on port ${port} did not start.`);
}
async function exists(path) { try { await access(path); return true; } catch { return false; } }

async function stopChild(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise(done => { const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); killer.on('exit', done); killer.on('error', done); });
  } else {
    child.kill('SIGTERM');
    await new Promise(done => { const timer = setTimeout(done, 3000); child.once('exit', () => { clearTimeout(timer); done(); }); });
  }
}
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  console.log('\nStopping local services…');
  // Export the Auth emulator before stopping its owned process tree.
  if (children[0]?.exitCode === null && await portOpen(9099)) {
    await new Promise(done => {
      const exporter = spawn(process.execPath, [firebaseCli, 'emulators:export', resolve(localData, 'firebase'), '--project', 'demo-fieldnotes', '--force'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
      const timeout = setTimeout(() => { exporter.kill(); done(); }, 15000);
      exporter.on('exit', () => { clearTimeout(timeout); done(); });
      exporter.on('error', () => { clearTimeout(timeout); done(); });
    });
  }
  for (const child of [...children].reverse()) await stopChild(child);
  await mongo?.stop({ doCleanup: false });
  process.exit(code);
}
process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());

try {
  for (const port of [4000, 4001, 4400, 4500, 5173, 9099, 27018]) {
    if (await portOpen(port)) throw new Error(`Port ${port} is in use. Stop that service before running dev:local.`);
  }
  await mkdir(resolve(localData, 'mongo'), { recursive: true });
  console.log('Starting a local MongoDB database and Firebase Authentication Emulator.');
  console.log('The first run downloads MongoDB. No cloud account or Docker is required.');
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: resolve(localData, 'binaries') }, instance: { port: 27018, dbPath: resolve(localData, 'mongo'), storageEngine: 'wiredTiger', ip: '127.0.0.1' } });
  env.MONGODB_URI = mongo.getUri();
  const args = ['emulators:start', '--only', 'auth', '--project', 'demo-fieldnotes', '--export-on-exit', resolve(localData, 'firebase')];
  if (await exists(resolve(localData, 'firebase', 'firebase-export-metadata.json'))) args.push('--import', resolve(localData, 'firebase'));
  start(firebaseCli, args);
  await waitFor(9099);

  process.env.FIREBASE_PROJECT_ID = env.FIREBASE_PROJECT_ID;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = env.FIREBASE_AUTH_EMULATOR_HOST;
  const { initializeApp } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const auth = getAuth(initializeApp({ projectId: env.FIREBASE_PROJECT_ID }, 'local-bootstrap'));
  let user;
  try { user = await auth.getUserByEmail('admin@fieldnotes.local'); }
  catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    user = await auth.createUser({ email: 'admin@fieldnotes.local', password: 'Fieldnotes123!', displayName: 'Local Author', emailVerified: true });
  }
  await auth.setCustomUserClaims(user.uid, { admin: true });
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const { initializeCollections } = await import('../backend/src/database.js');
    const db = client.db(env.MONGODB_DB);
    await initializeCollections(db);
    for (const post of samplePosts) {
      const date = new Date(post.publishedAt);
      await db.collection('posts').updateOne({ slug: post.slug }, { $setOnInsert: { ...post, author: { uid: user.uid, name: 'Local Author' }, createdAt: date, updatedAt: date, publishedAt: date } }, { upsert: true });
    }
  } finally { await client.close(); }
  start(resolve(root, 'backend/src/index.js'), []);
  start(resolve(root, 'node_modules/vite/bin/vite.js'), ['frontend', '--host', '127.0.0.1', '--config', 'frontend/vite.config.js']);
  await waitFor(5173);
  console.log('\nFieldnotes is ready at http://127.0.0.1:5173');
  console.log('Local demo admin: admin@fieldnotes.local / Fieldnotes123!');
  console.log('These credentials only work in your local Firebase emulator. Press Ctrl+C to stop.');
} catch (error) {
  console.error('Local startup failed:', error.message);
  await shutdown(1);
}
