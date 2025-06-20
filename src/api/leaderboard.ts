import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const users = await redis.hgetall('users');
  const leaderboard = Object.entries(users)
    .map(([username, data]) => {
      const user = JSON.parse(data as string);
      return { username, score: user.score || 0, games: user.games || 0 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  res.status(200).json({ leaderboard });
} 