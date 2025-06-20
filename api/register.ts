import { hash } from 'bcryptjs';
import { redis } from './redis';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  const { username, password } = await req.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400 });
  }
  const exists = await redis.hexists('users', username);
  if (exists) {
    return new Response(JSON.stringify({ error: 'Tên đã tồn tại' }), { status: 400 });
  }
  const hashed = await hash(password, 10);
  await redis.hset('users', { [username]: hashed });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 