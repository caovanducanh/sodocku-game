import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Turnstile token is required' });
  }

  try {
    const ip = req.headers['x-forwarded-for'];
    
    const body: { secret: string; response: string; remoteip?: string } = {
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    };
    if (ip) {
      body.remoteip = Array.isArray(ip) ? ip[0] : ip;
    }

    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v2/siteverify',
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data;

    if (data.success) {
      return res.status(200).json({ success: true, message: 'Human verification successful.' });
    } else {
      console.error('Turnstile verification failed with error codes:', data['error-codes']);
      return res.status(400).json({ success: false, error: 'Failed human verification.', 'error-codes': data['error-codes'] });
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Axios error during Turnstile verification:', error.response?.status, error.response?.data);
    } else {
        console.error('Generic error during Turnstile verification:', error);
    }
    return res.status(500).json({ error: 'Server error during verification.' });
  }
} 