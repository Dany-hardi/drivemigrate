import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createOAuthClient, getAuthUrl, getUserInfo } from '../services/googleAuth.js';

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret';

// Helper to get accounts from JWT cookie
function getAccounts(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.query._token;
    if (!token) return {};
    return jwt.verify(token, JWT_SECRET).accounts || {};
  } catch {
    return {};
  }
}

// Step 1: Redirect user to Google OAuth
router.get('/connect', (req, res) => {
  const { account } = req.query;
  if (!['source', 'dest'].includes(account)) {
    return res.status(400).json({ error: 'account must be "source" or "dest"' });
  }
  const client = createOAuthClient();
  const url = getAuthUrl(client, account);
  res.json({ url });
});

// Step 2: Google redirects here after user grants permission
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) return res.redirect(`${FRONTEND}/auth-error?reason=${error}`);

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await getUserInfo(client);

    // Get existing accounts from token if present
    let existingAccounts = {};
    try {
      const existingToken = req.query.state_token;
      if (existingToken) {
        existingAccounts = jwt.verify(existingToken, JWT_SECRET).accounts || {};
      }
    } catch {}

    // Add new account
    existingAccounts[state] = {
      tokens,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };

    // Sign a new JWT with all accounts
    const jwtToken = jwt.sign(
      { accounts: existingAccounts },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Redirect to frontend with token
    res.redirect(`${FRONTEND}/connect?connected=${state}&token=${jwtToken}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${FRONTEND}/auth-error?reason=token_exchange_failed`);
  }
});

// Get current auth state
router.get('/status', (req, res) => {
  const accounts = getAccounts(req);
  res.json({
    source: accounts.source ? {
      email: accounts.source.email,
      name: accounts.source.name,
      picture: accounts.source.picture,
    } : null,
    dest: accounts.dest ? {
      email: accounts.dest.email,
      name: accounts.dest.name,
      picture: accounts.dest.picture,
    } : null,
  });
});

// Export getAccounts for use in other routes
export { getAccounts };
export default router;
