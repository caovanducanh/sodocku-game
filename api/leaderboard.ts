import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // Lấy top 10 từ sorted set leaderboard (dùng zrange với rev)
  const top = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
  // top: [username1, score1, username2, score2, ...]
  const leaderboard: { username: string; score: number }[] = [];
  for (let i = 0; i < top.length; i += 2) {
    leaderboard.push({ username: top[i] as string, score: Number(top[i + 1]) });
  }

  // Nếu có token, trả về vị trí của user hiện tại
  let user: { rank: number; score: number } | null = null;
  const token = req.headers.authorization?.replace('Bearer ', '') || (typeof req.query.token === 'string' ? req.query.token : undefined);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { username: string };
      const rank = await redis.zrevrank('leaderboard', payload.username);
      const score = await redis.zscore('leaderboard', payload.username);
      if (rank !== null && score !== null) {
        user = { rank: rank + 1, score: Number(score) };
      }
    } catch {
      // Bỏ qua lỗi token
    }
  }

  res.status(200).json({ leaderboard, user });
} 