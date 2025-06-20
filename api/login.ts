import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';
const LOG_FILE = './login-debug.log';

function logToFile(...args: unknown[]) {
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      logToFile('Wrong method:', req.method);
      return res.status(405).json({ error: 'Wrong method' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      logToFile('Missing username or password:', req.body);
      return res.status(400).json({ error: 'Missing username or password' });
    }

    const userRaw = await redis.hget('users', username);
    logToFile('userRaw:', userRaw);
    if (!userRaw) {
      logToFile('User not found:', username);
      return res.status(401).json({ error: 'User not found', debug: { username } });
    }

    let user: { password: string, score: number, games: number };
    try {
      user = JSON.parse(userRaw as string);
      logToFile('user:', user);
    } catch (e: unknown) {
      const stack = e instanceof Error ? e.stack : null;
      logToFile('JSON parse error:', e, userRaw);
      return res.status(500).json({ error: 'JSON parse error', userRaw, stack });
    }

    if (!user.password) {
      logToFile('No password in user data:', user);
      return res.status(500).json({ error: 'No password in user data', user });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password);
      logToFile('Compare:', password, user.password, '=>', valid);
    } catch (e: unknown) {
      const stack = e instanceof Error ? e.stack : null;
      logToFile('Bcrypt compare error:', e, password, user.password);
      return res.status(500).json({ error: 'Bcrypt compare error', password, hash: user.password, stack });
    }

    if (!valid) {
      logToFile('Invalid credentials:', user);
      return res.status(401).json({ error: 'Invalid credentials', user });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    logToFile('Login success:', username);
    res.status(200).json({ token, username, score: user.score, games: user.games });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : null;
    logToFile('Catch error:', message, stack);
    res.status(500).json({ error: message, stack });
  }
}