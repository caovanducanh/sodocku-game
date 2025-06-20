import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { redis } from './redis';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  const { username, password } = await req.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400 });
  }
  const hashed = await redis.hget('users', username);
  if (!hashed) {
    return new Response(JSON.stringify({ error: 'Sai tài khoản hoặc mật khẩu' }), { status: 400 });
  }
  const ok = await compare(password, hashed);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Sai tài khoản hoặc mật khẩu' }), { status: 400 });
  }
  const token = sign({ username }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  return new Response(JSON.stringify({ username, token }), { status: 200 });
} 