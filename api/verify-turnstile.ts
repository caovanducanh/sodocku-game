import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', Array.isArray(ip) ? ip[0] : ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v2/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log('Cloudflare raw response:', responseText);

    if (!response.ok) {
        console.error(`Cloudflare API returned status: ${response.status}`);
        return res.status(500).json({ error: 'Failed to communicate with Cloudflare.' });
    }

    try {
        const data: { success: boolean; 'error-codes'?: string[] } = JSON.parse(responseText);

        if (data.success) {
          return res.status(200).json({ success: true, message: 'Human verification successful.' });
        } else {
          console.error('Turnstile verification failed with error codes:', data['error-codes']);
          return res.status(400).json({ success: false, error: 'Failed human verification.', 'error-codes': data['error-codes'] });
        }
    } catch (e) {
        console.error('Failed to parse JSON response from Cloudflare.', e);
        return res.status(500).json({ error: 'Invalid response from Cloudflare.' });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({ error: 'Server error during verification.' });
  }
} 