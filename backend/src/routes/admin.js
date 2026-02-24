import { Router } from 'express';
import IORedis from 'ioredis';

const router = Router();
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get all job keys from Redis
    const keys = await redis.keys('job:*');
    const jobs = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        try { jobs.push(JSON.parse(data)); } catch {}
      }
    }

    // Sort by created_at desc
    jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const stats = {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      pendingJobs: jobs.filter(j => ['pending','running'].includes(j.status)).length,
      totalFilesTransferred: jobs.reduce((sum, j) => sum + (j.transferred || 0), 0),
      totalBytesTransferred: jobs.reduce((sum, j) => sum + (j.bytes_transferred || 0), 0),
    };

    res.json({
      stats,
      recentJobs: jobs.slice(0, 20),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
