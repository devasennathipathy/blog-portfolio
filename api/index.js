import { createServerlessHandler } from '../backend/src/serverless.js';

// One Vercel Node.js function handles every /api route through Express.
export default createServerlessHandler();
