import { redis } from './redis';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  const raw = await redis.lrange('leaderboard', 0, 99);
  const data = raw.map((item: string) => JSON.parse(item));
  return new Response(JSON.stringify(data), { status: 200 });
} 