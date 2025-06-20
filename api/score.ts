import { redis } from './redis';
import { verify } from 'jsonwebtoken';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }
  const { token, score, difficulty, time } = await req.json();
  if (!token || !score || !difficulty || !time) {
    return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400 });
  }
  let username = '';
  try {
    const decoded = verify(token, process.env.JWT_SECRET!);
    username = (decoded as any).username;
  } catch {
    return new Response(JSON.stringify({ error: 'Token không hợp lệ' }), { status: 401 });
  }
  const entry = { username, score, difficulty, time };
  await redis.lpush('leaderboard', JSON.stringify(entry));
  await redis.ltrim('leaderboard', 0, 99); // giữ top 100
  return new Response(JSON.stringify({ success: true }), { status: 200 });
} 