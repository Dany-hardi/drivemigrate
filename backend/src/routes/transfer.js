import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { createJob, getJob } from '../services/db.js';

const router = Router();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const transferQueue = new Queue('transfer', { connection });

// Start a new transfer job
router.post('/start', async (req, res) => {
  const accounts = req.session?.accounts;
  if (!accounts?.source) return res.status(401).json({ error: 'Source account not connected' });
  if (!accounts?.dest) return res.status(401).json({ error: 'Destination account not connected' });

  const { selectedItems } = req.body; // array of { id, name, type: 'file'|'folder' }
  if (!selectedItems || !selectedItems.length) {
    return res.status(400).json({ error: 'No items selected for transfer' });
  }

  if (accounts.source.email === accounts.dest.email) {
    return res.status(400).json({ error: 'Source and destination accounts must be different' });
  }

  const jobId = uuidv4();

  // Store in DB
  createJob(jobId, accounts.source.email, accounts.dest.email, selectedItems);

  // Push to queue with tokens
  await transferQueue.add('migrate', {
    jobId,
    sourceTokens: accounts.source.tokens,
    destTokens: accounts.dest.tokens,
    selectedItems,
  }, { jobId });

  res.json({ jobId });
});

// Get job status
router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// SSE progress stream
router.get('/:jobId/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const interval = setInterval(() => {
    const job = getJob(req.params.jobId);
    if (!job) {
      send({ error: 'Job not found' });
      clearInterval(interval);
      return res.end();
    }
    send(job);
    if (['completed', 'failed'].includes(job.status)) {
      clearInterval(interval);
      res.end();
    }
  }, 1500);

  req.on('close', () => clearInterval(interval));
});

export default router;
