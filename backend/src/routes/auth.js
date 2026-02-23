import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createOAuthClient, getAuthUrl, getUserInfo } from '../services/googleAuth.js';

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret';

// Helper to get accounts from JWT Authorization header
export function getAccounts(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return {};
    return jwt.verify(token, JWT_SECRET).accounts || {};
  } catch {
    return {};
  }
}

// Step 1: Redirect to Google OAuth
// Pass existing token as state so we can merge accounts after callback
router.get('/connect', (req, res) => {
  const { account } = req.query;
  if (!['source', 'dest'].includes(account)) {
    return res.status(400).json({ error: 'account must be "source" or "dest"' });
  }

  // Get existing token to preserve already-connected accounts
  const existingToken = req.headers.authorization?.split(' ')[1] || '';

  const client = createOAuthClient();
  // Encode account type + existing token in state param
  const statePayload = Buffer.from(JSON.stringify({
    account,
    existingToken,
  })).toString('base64url');

  const url = getAuthUrl(client, statePayload);
  res.json({ url });
});

// Step 2: Google redirects here after user grants permission
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) return res.redirect(`${FRONTEND}/auth-error?reason=${error}`);

  try {
    // Decode state to get account type and existing token
    let accountType = state;
    let existingAccounts = {};

    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      accountType = decoded.account;
      if (decoded.existingToken) {
        const verified = jwt.verify(decoded.existingToken, JWT_SECRET);
        existingAccounts = verified.accounts || {};
      }
    } catch {
      // state was plain string (fallback)
      accountType = state;
    }

    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await getUserInfo(client);

    // Merge new account with existing accounts — this is the key fix
    existingAccounts[accountType] = {
      tokens,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };

    // Sign JWT with ALL accounts (both source and dest preserved)
    const jwtToken = jwt.sign(
      { accounts: existingAccounts },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.redirect(`${FRONTEND}/connect?connected=${accountType}&token=${jwtToken}`);
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

export default router;
