import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Helper function to generate a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
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

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Tên đăng nhập, mật khẩu và email là bắt buộc' });
  }
  
  // Basic email validation
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
  }

  try {
    // Check if username is already taken in the main users hash
    const existingUser = await redis.hget('users', username);
    if (existingUser) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    // Check if email is already in use
    const allUsers = await redis.hgetall('users');
    if (allUsers) {
      for (const userKey in allUsers) {
        const userData = JSON.parse(allUsers[userKey] as string);
        if (userData.email === email) {
          return res.status(409).json({ error: 'Email này đã được sử dụng' });
        }
      }
    }

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store unverified user data in Redis with a 10-minute expiry
    const key = `unverified_user:${username}`;
    const value = JSON.stringify({ hashedPassword, email, otp });
    await redis.set(key, value, { ex: 600 }); // ex: 600 seconds = 10 minutes

    // Send OTP email
    await transporter.sendMail({
      from: `"Sudoku Master" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực tài khoản Sudoku Master',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
          <h2>Chào mừng đến với Sudoku Master!</h2>
          <p>Mã xác thực của bạn là:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px 20px; border-radius: 8px;">
            ${otp}
          </p>
          <p>Mã này sẽ hết hạn sau 10 phút.</p>
          <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và xác thực.' });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Lỗi từ server, vui lòng thử lại sau.' });
  }
} 