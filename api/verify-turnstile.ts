import type { VercelRequest, VercelResponse } from '@vercel/node';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Turnstile token is required' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v2/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data: { success: boolean; 'error-codes'?: string[] } = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true, message: 'Human verification successful.' });
    } else {
      return res.status(400).json({ success: false, error: 'Failed human verification.', 'error-codes': data['error-codes'] });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({ error: 'Server error during verification.' });
  }
} 