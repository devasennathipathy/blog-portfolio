import { z } from 'zod';
import { categories, coverThemes } from '../../shared/posts.js';

export const postSchema = z.object({
  title: z.string().trim().min(3).max(160),
  excerpt: z.string().trim().min(10).max(350),
  content: z.string().trim().min(50).max(50000),
  category: z.enum(categories),
  tags: z.array(z.string().trim().min(1).max(30)).max(6).default([]),
  coverTheme: z.enum(coverThemes).default('green'),
  status: z.enum(['draft', 'published']).default('draft'),
  featured: z.boolean().default(false),
}).strict();

export const feedSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(9),
  category: z.enum(categories).optional(),
  search: z.string().trim().max(100).default(''),
}).strict();

export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const publicPost = post => {
  if (!post) return null;
  const { _id, ...rest } = post;
  return { ...rest, id: _id.toString(), readingTime: Math.max(1, Math.ceil(post.content.trim().split(/\s+/).length / 200)) };
};
