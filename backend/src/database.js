import { MongoClient } from 'mongodb';
import { config } from './config.js';

export async function connectDatabase(uri = config.mongoUri, name = config.mongoDb) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db(name);
    await db.command({ ping: 1 });
    await initializeCollections(db);
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}

export async function initializeCollections(db) {
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  if (!existing.some(c => c.name === 'posts')) {
    await db.createCollection('posts', { validator: { $jsonSchema: {
      bsonType: 'object', required: ['title', 'slug', 'content', 'status', 'author', 'createdAt', 'updatedAt'],
      properties: {
        title: { bsonType: 'string' }, slug: { bsonType: 'string' }, content: { bsonType: 'string' },
        status: { enum: ['draft', 'published'] },
        author: { bsonType: 'object', required: ['uid', 'name'] },
        createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' },
      },
    } } });
  }
  if (!existing.some(c => c.name === 'users')) await db.createCollection('users');
  await db.collection('posts').createIndexes([
    { key: { slug: 1 }, unique: true, name: 'unique_slug' },
    { key: { status: 1, publishedAt: -1, _id: -1 }, name: 'published_feed' },
    { key: { status: 1, category: 1, publishedAt: -1 }, name: 'category_feed' },
    { key: { updatedAt: -1 }, name: 'admin_recent' },
  ]);
  await db.collection('users').createIndex({ uid: 1 }, { unique: true });
}
