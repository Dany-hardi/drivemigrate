import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { createJob, getJob } from '../services/db.js';
import { getAccounts } from './auth.js';

const router = Router();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const transferQueue = new Queue('transfer', { connection });

router.post('/start', async (req, res) => {
  const accounts = getAccounts(req);
  if (!accounts?.source) return res.status(401).json({ error: 'Source account not connected' });
  if (!accounts?.dest) return res.status(401).json({ error: 'Destination account not connected' });

  const { selectedItems } = req.body;
  if (!selectedItems || !selectedItems.length) {
    return res.status(400).json({ error: 'No items selected for transfer' });
  }

  if (accounts.source.email === accounts.dest.email) {
    return res.status(400).json({ error: 'Source and destination accounts must be different' });
  }

  const jobId = uuidv4();
  createJob(jobId, accounts.source.email, accounts.dest.email, selectedItems);

  await transferQueue.add('migrate', {
    jobId,
    sourceTokens: accounts.source.tokens,
    destTokens: accounts.dest.tokens,
    selectedItems,
  }, { jobId });

  res.json({ jobId });
});

router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.get('/:jobId/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const interval = setInterval(() => {
    const job = getJob(req.params.jobId);
    if (!job) { send({ error: 'Job not found' }); clearInterval(interval); return res.end(); }
    send(job);
    if (['completed', 'failed'].includes(job.status)) { clearInterval(interval); res.end(); }
  }, 1500);

  req.on('close', () => clearInterval(interval));
});

export default router;
