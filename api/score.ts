import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, score } = req.body;
  if (!token || typeof score !== 'number') return res.status(400).json({ error: 'Missing token or score' });
  let username = '';
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { username: string };
    username = payload.username;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userRaw = await redis.hget('users', username);
  if (!userRaw) return res.status(404).json({ error: 'User not found' });
  const user = JSON.parse(userRaw as string);
  user.score = (user.score || 0) + score;
  user.games = (user.games || 0) + 1;
  await redis.hset('users', { [username]: JSON.stringify(user) });
  await redis.zadd('leaderboard', { score: user.score, member: username });
  res.status(200).json({ message: 'Score updated', score: user.score, games: user.games });
} 