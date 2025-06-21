import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redis } from './redis';
import nodemailer from 'nodemailer';

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

  const { email, turnstileToken } = req.body;

  if (!turnstileToken) {
    return res.status(400).json({ error: 'Yêu cầu xác thực người dùng.' });
  }

  // --- Verify Turnstile Token ---
  try {
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v2/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });
    const turnstileData: { success: boolean } = await turnstileResponse.json();
    if (!turnstileData.success) {
      return res.status(401).json({ error: 'Xác thực người dùng thất bại.' });
    }
  } catch (error) {
    console.error('Turnstile verification error in send-otp:', error);
    return res.status(500).json({ error: 'Lỗi server khi xác thực người dùng.' });
  }
  // --- End Turnstile Verification ---

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
  }

  try {
    // Check if email is already in use by a verified user
    const allUsers = await redis.hgetall<{ [key: string]: { email?: string } }>('users');
    if (allUsers) {
      for (const userKey in allUsers) {
        const userData = allUsers[userKey];
        if (userData && userData.email === email) {
          return res.status(409).json({ error: 'Email này đã được sử dụng' });
        }
      }
    }

    const otp = generateOtp();

    // Store OTP in Redis with a 5-minute expiry, keyed by email
    await redis.set(`otp:${email}`, otp, { ex: 300 });

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
          <p>Mã này sẽ hết hạn sau 5 phút.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn.' });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Lỗi từ server, không thể gửi mã OTP.' });
  }
} 