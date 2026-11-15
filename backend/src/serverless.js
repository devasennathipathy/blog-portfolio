import { config } from './config.js';
import { connectDatabase } from './database.js';
import { firebaseAuth } from './firebase.js';
import { createApp } from './app.js';

export function createServerlessHandler({ initialize = initializeApp } = {}) {
  // Share a single initialization promise across concurrent requests and reuse
  // MongoDB's connection pool while this function instance stays warm.
  let application;
  return async (req, res) => {
    try {
      if (!application) application = initialize().catch(error => { application = null; throw error; });
      const app = await application;
      return app(req, res);
    } catch (error) {
      console.error('API initialization failed:', error.name);
      res.setHeader('Cache-Control', 'no-store');
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'The service is temporarily unavailable. Please try again later.' }));
    }
  };
}

async function initializeApp() {
  const auth = firebaseAuth();
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  if (!config.mongoUri) throw new Error('MongoDB is not configured.');
  const { db } = await connectDatabase();
  return createApp({ db, verifyToken: token => auth.verifyIdToken(token, true) });
}
