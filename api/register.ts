import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
    const exists = await redis.hget('users', username);
    if (exists) return res.status(409).json({ error: 'Username already exists' });
    const hash = await bcrypt.hash(password, 10);
    await redis.hset('users', { [username]: JSON.stringify({ password: hash, score: 0, games: 0 }) });
    await redis.zadd('leaderboard', { score: 0, member: username });
    res.status(201).json({ message: 'User registered' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e), stack: e?.stack || null });
  }
} 