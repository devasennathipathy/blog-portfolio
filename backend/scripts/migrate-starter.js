import { connectDatabase } from '../src/database.js';
import { config } from '../src/config.js';

if (!config.mongoUri) throw new Error('Set MONGODB_URI in backend/.env before migrating.');
const { client, db } = await connectDatabase();
let copied = 0;
let skipped = 0;
try {
  // The mentor starter uses blogDB.blogs with newTitle/newContent/date/likes.
  const source = client.db(process.env.STARTER_MONGODB_DB || 'blogDB').collection('blogs');
  for await (const legacy of source.find()) {
    const title = String(legacy.newTitle || '').trim().slice(0, 160);
    const content = String(legacy.newContent || '').trim().slice(0, 50000);
    if (!title || !content) { skipped++; continue; }
    const parsed = new Date(legacy.date);
    const date = Number.isNaN(parsed.getTime()) ? legacy._id.getTimestamp?.() || new Date() : parsed;
    const id = String(legacy._id);
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'article'}-${id}`;
    const result = await db.collection('posts').updateOne({ legacyId: id }, { $setOnInsert: {
      legacyId: id, slug, title, content, excerpt: content.slice(0, 240), tags: [], category: 'Development', coverTheme: 'green',
      // Original starter posts were public; import as drafts for review by an admin.
      status: 'draft', featured: false, author: { uid: 'legacy-import', name: 'Portfolio author' },
      createdAt: date, updatedAt: new Date(), publishedAt: null,
      likes: Number.isSafeInteger(legacy.likes) && legacy.likes > 0 ? legacy.likes : 0,
    } }, { upsert: true });
    copied += result.upsertedCount;
  }
  console.log(`Imported ${copied} posts as drafts; skipped ${skipped} empty posts. Existing source data was preserved.`);
} finally { await client.close(); }
