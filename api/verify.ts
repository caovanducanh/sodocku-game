import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, otp } = req.body;

  if (!username || !otp) {
    return res.status(400).json({ error: 'Username and OTP are required' });
  }

  try {
    const key = `unverified_user:${username}`;
    const data = await redis.get(key);

    if (!data) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.' });
    }

    const userData = JSON.parse(data as string);

    if (userData.otp !== otp) {
      return res.status(400).json({ error: 'Mã OTP không chính xác.' });
    }

    // OTP is correct, create user
    const { hashedPassword, email } = userData;
    const userPayload = {
      password: hashedPassword,
      score: 0,
      games: 0,
      email: email,
    };

    // Use a transaction to ensure atomicity
    const multi = redis.multi();
    multi.hset('users', { [username]: JSON.stringify(userPayload) });
    multi.zadd('leaderboard', { score: 0, member: username });
    multi.del(key);
    await multi.exec();
    
    return res.status(200).json({ message: 'Xác thực thành công! Bây giờ bạn có thể đăng nhập.' });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ error: 'Lỗi từ server, vui lòng thử lại.' });
  }
} 