import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await redis.set('foo', 'bar');
    const value = await redis.get('foo');
    res.status(200).json({ value });
  } catch (e) {
    res.status(500).json({ error: String(e), env: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'set' : 'missing',
    }});
  }
} 