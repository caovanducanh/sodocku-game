import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from '../redis';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password, email } = req.body;

  if (!username || !password || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ và chính xác thông tin.' });
  }

  try {
    const multi = redis.multi();
    multi.hget('users', username);
    multi.hgetall<{ [key: string]: { email?: string } }>('users');
    const [existingUser, allUsers] = await multi.exec<[unknown, { [key: string]: { email?: string } } | null]>();

    if (existingUser) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    if (allUsers) {
      for (const userKey in allUsers) {
        if (allUsers[userKey]?.email === email) {
          return res.status(409).json({ error: 'Email này đã được sử dụng' });
        }
      }
    }

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 10);

    const key = `unverified_user:${username}`;
    const value = JSON.stringify({ hashedPassword, email, otp });
    await redis.set(key, value, { ex: 600 }); // 10-minute expiry

    await transporter.sendMail({
      from: `"Sudoku Master" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực tài khoản Sudoku Master',
      html: `<p>Mã xác thực của bạn là: <strong>${otp}</strong>. Mã này sẽ hết hạn sau 10 phút.</p>`,
    });

    return res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn.' });

  } catch (error) {
    console.error('Registration start error:', error);
    return res.status(500).json({ error: 'Lỗi từ server, vui lòng thử lại sau.' });
  }
} 