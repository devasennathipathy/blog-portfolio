import { connectDatabase } from '../src/database.js';
import { config } from '../src/config.js';
import { samplePosts } from '../../shared/posts.js';

if (!config.mongoUri) throw new Error('Set MONGODB_URI in backend/.env before seeding.');
const { client, db } = await connectDatabase();
try {
  for (const post of samplePosts) {
    const date = new Date(post.publishedAt);
    await db.collection('posts').updateOne({ slug: post.slug }, { $setOnInsert: {
      ...post, publishedAt: date, createdAt: date, updatedAt: date,
      author: { uid: 'seed', name: 'The Fieldnotes author' },
    } }, { upsert: true });
  }
  console.log('Sample posts are ready. Existing posts were preserved.');
} finally { await client.close(); }
