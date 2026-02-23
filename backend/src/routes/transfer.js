import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { createJob, getJob } from '../services/db.js';
import { getAccounts } from './auth.js';

const router = Router();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const transferQueue = new Queue('transfer', { connection });

router.post('/start', async (req, res) => {
  const accounts = getAccounts(req);
  if (!accounts?.source) return res.status(401).json({ error: 'Source account not connected' });
  if (!accounts?.dest) return res.status(401).json({ error: 'Destination account not connected' });

  const { selectedItems } = req.body;
  if (!selectedItems || !selectedItems.length) {
    return res.status(400).json({ error: 'No items selected' });
  }

  if (accounts.source.email === accounts.dest.email) {
    return res.status(400).json({ error: 'Source and destination must be different accounts' });
  }

  const jobId = uuidv4();
  await createJob(jobId, accounts.source.email, accounts.dest.email, selectedItems);

  await transferQueue.add('migrate', {
    jobId,
    sourceTokens: accounts.source.tokens,
    destTokens: accounts.dest.tokens,
    selectedItems,
  }, { jobId });

  res.json({ jobId });
});

router.get('/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
