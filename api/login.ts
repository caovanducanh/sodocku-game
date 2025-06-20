import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      console.log('Wrong method:', req.method);
      return res.status(405).json({ error: 'Wrong method' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      console.log('Missing username or password:', req.body);
      return res.status(400).json({ error: 'Missing username or password' });
    }

    const userRaw = await redis.hget('users', username);
    console.log('userRaw:', userRaw);
    if (!userRaw) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'User not found', debug: { username } });
    }

    let user: { password: string, score: number, games: number };
    if (typeof userRaw === 'string') {
      try {
        user = JSON.parse(userRaw);
        console.log('user:', user);
      } catch (e: unknown) {
        const stack = e instanceof Error ? e.stack : null;
        console.log('JSON parse error:', e, userRaw);
        return res.status(500).json({ error: 'JSON parse error', userRaw, stack });
      }
    } else if (typeof userRaw === 'object' && userRaw !== null) {
      user = userRaw as any;
      console.log('user (object):', user);
    } else {
      console.log('Unknown userRaw type:', typeof userRaw, userRaw);
      return res.status(500).json({ error: 'Unknown userRaw type', userRaw });
    }

    if (!user.password) {
      console.log('No password in user data:', user);
      return res.status(500).json({ error: 'No password in user data', user });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password);
      console.log('Compare:', password, user.password, '=>', valid);
    } catch (e: unknown) {
      const stack = e instanceof Error ? e.stack : null;
      console.log('Bcrypt compare error:', e, password, user.password);
      return res.status(500).json({ error: 'Bcrypt compare error', password, hash: user.password, stack });
    }

    if (!valid) {
      console.log('Invalid credentials:', user);
      return res.status(401).json({ error: 'Invalid credentials', user });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Login success:', username);
    res.status(200).json({ token, username, score: user.score, games: user.games });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : null;
    console.log('Catch error:', message, stack);
    res.status(500).json({ error: message, stack });
  }
}