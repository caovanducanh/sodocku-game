import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { redis } from '../../redis';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://sodocku-game.vercel.app/api/auth/google/callback'
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (typeof code !== 'string') {
    return res.status(400).send('Invalid code');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).send('Failed to get user information from Google');
    }
    
    let username = payload.email.split('@')[0];
    const email = payload.email;

    // Find user by email
    let userFromDb: { email?: string, password?: string, score?: number, games?: number } | null = null;
    let existingUsername: string | null = null;
    const allUsers = await redis.hgetall<{ [key: string]: { email?: string, password?: string, score?: number, games?: number } }>('users');
    if (allUsers) {
        for (const userKey in allUsers) {
            if (allUsers[userKey]?.email === email) {
                userFromDb = allUsers[userKey];
                existingUsername = userKey;
                break;
            }
        }
    }
    
    // If user doesn't exist, create a new one
    if (!userFromDb) {
      // Check if generated username already exists, if so, append random numbers
      let isUsernameTaken = await redis.hget('users', username);
      while (isUsernameTaken) {
        username = `${username}${Math.floor(Math.random() * 1000)}`;
        isUsernameTaken = await redis.hget('users', username);
      }

      const userPayload = {
        password: '', // No password for Google users
        score: 0,
        games: 0,
        email: email,
        googleId: payload.sub,
      };

      await redis.hset('users', { [username]: JSON.stringify(userPayload) });
      await redis.zadd('leaderboard', { score: 0, member: username });
    } else {
        username = existingUsername!;
    }

    const sessionToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    
    // Redirect user back to the frontend with token
    const redirectUrl = new URL('https://sodocku-game.vercel.app');
    redirectUrl.searchParams.set('token', sessionToken);
    redirectUrl.searchParams.set('username', username);

    res.writeHead(302, { Location: redirectUrl.toString() });
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).send('Authentication failed');
  }
} 