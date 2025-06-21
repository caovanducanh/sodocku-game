import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password, email, otp } = req.body;

  if (!username || !password || !email || !otp) {
    return res.status(400).json({ error: 'Tất cả các trường là bắt buộc' });
  }

  try {
    // 1. Check if username is already taken
    const existingUser = await redis.hget('users', username);
    if (existingUser) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // 2. Verify OTP
    const otpKey = `otp:${email}`;
    const storedOtp = await redis.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Mã OTP không chính xác.' });
    }

    // 3. Create user
    const hashedPassword = await bcrypt.hash(password, 10);
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
    multi.del(otpKey); // Delete OTP after use
    await multi.exec();
    
    return res.status(201).json({ message: 'Đăng ký thành công! Bây giờ bạn có thể đăng nhập.' });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Lỗi từ server, vui lòng thử lại sau.' });
  }
} 