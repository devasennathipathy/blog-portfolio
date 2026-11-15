import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

export const config = {
  port: Number(process.env.PORT || 4000),
  production: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGODB_URI || '',
  mongoDb: process.env.MONGODB_DB || 'fieldnotes',
  origins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(v => v.trim()),
};

if (config.production && process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('The Firebase Auth emulator must not be used in production.');
}
if (config.production && !config.mongoUri) {
  throw new Error('MONGODB_URI is required in production.');
}
