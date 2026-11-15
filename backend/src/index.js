import { config } from './config.js';
import { connectDatabase } from './database.js';
import { firebaseAuth } from './firebase.js';
import { createApp } from './app.js';

let connection;
try {
  if (config.mongoUri) connection = await connectDatabase();
  const auth = firebaseAuth();
  if (config.production && !auth) throw new Error('FIREBASE_PROJECT_ID and Firebase Admin credentials are required in production.');
  const app = createApp({ db: connection?.db, verifyToken: auth ? token => auth.verifyIdToken(token, true) : null });
  const server = app.listen(config.port, '127.0.0.1', () => {
    console.log(`Fieldnotes API: http://127.0.0.1:${config.port}`);
    if (!connection) console.log('Read-only sample preview. Configure backend/.env to connect MongoDB.');
    if (!auth) console.log('Firebase is not configured. See README.md for account setup.');
  });
  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.close(async () => { await connection?.client.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('Unable to start Fieldnotes:', error.name, '— check your MongoDB and Firebase configuration.');
  await connection?.client.close();
  process.exitCode = 1;
}
