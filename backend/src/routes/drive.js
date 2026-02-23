import { Router } from 'express';
import { google } from 'googleapis';
import { createOAuthClient } from '../services/googleAuth.js';
import { listFolders, listFolderContents } from '../services/driveService.js';
import { getAccounts } from './auth.js';

const router = Router();

function requireAccount(account) {
  return (req, res, next) => {
    const accounts = getAccounts(req);
    const acc = accounts[account];
    if (!acc) return res.status(401).json({ error: `${account} account not connected` });
    const auth = createOAuthClient();
    auth.setCredentials(acc.tokens);
    req[`${account}Drive`] = google.drive({ version: 'v3', auth });
    next();
  };
}

router.get('/source/folders', requireAccount('source'), async (req, res) => {
  try {
    const folders = await listFolders(req.sourceDrive);
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/source/folders/:folderId', requireAccount('source'), async (req, res) => {
  try {
    const files = await listFolderContents(req.sourceDrive, req.params.folderId);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/source/quota', requireAccount('source'), async (req, res) => {
  try {
    const about = await req.sourceDrive.about.get({ fields: 'storageQuota, user' });
    res.json(about.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
