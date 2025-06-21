import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from '../redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, otp } = req.body;

  if (!username || !otp) {
    return res.status(400).json({ error: 'Tên đăng nhập và OTP là bắt buộc' });
  }

  try {
    const key = `unverified_user:${username}`;
    const data = await redis.get(key);

    if (!data) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    let userData;
    try {
      userData = JSON.parse(data);
    } catch (e) {
      console.error('JSON parse error:', e);
      return res.status(500).json({ error: 'Lỗi dữ liệu người dùng.' });
    }

    if (userData.otp !== otp) {
      return res.status(400).json({ error: 'Mã OTP không chính xác.' });
    }

    const userPayload = {
      password: userData.hashedPassword,
      score: 0,
      games: 0,
      email: userData.email,
    };

    await redis.hset('users', username, JSON.stringify(userPayload));
    await redis.zadd('leaderboard', { score: 0, member: username });
    await redis.del(key);
    
    return res.status(201).json({ message: 'Đăng ký thành công! Bây giờ bạn có thể đăng nhập.' });

  } catch (error) {
    console.error('Confirmation error:', error);
    return res.status(500).json({ error: 'Lỗi từ server, vui lòng thử lại.' });
  }
} 