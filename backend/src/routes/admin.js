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

async function getAllJobs() {
  const keys = await redis.keys('job:*');
  const jobs = [];
  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      try { jobs.push(JSON.parse(data)); } catch {}
    }
  }
  return jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const jobs = await getAllJobs();
    const completed = jobs.filter(j => j.status === 'completed');
    const avgDuration = completed.length > 0
      ? completed.reduce((s, j) => s + (j.duration_ms || 0), 0) / completed.length
      : 0;

    const stats = {
      totalJobs: jobs.length,
      completedJobs: completed.length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      pendingJobs: jobs.filter(j => ['pending', 'running'].includes(j.status)).length,
      totalFilesTransferred: jobs.reduce((s, j) => s + (j.transferred || 0), 0),
      totalBytesTransferred: jobs.reduce((s, j) => s + (j.bytes_transferred || 0), 0),
      avgDurationMs: Math.round(avgDuration),
    };

    res.json({ stats, recentJobs: jobs.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Report endpoint — returns plain text report
router.get('/report', requireAdmin, async (req, res) => {
  try {
    const jobs = await getAllJobs();
    const completed = jobs.filter(j => j.status === 'completed');
    const failed = jobs.filter(j => j.status === 'failed');
    const totalBytes = jobs.reduce((s, j) => s + (j.bytes_transferred || 0), 0);
    const totalFiles = jobs.reduce((s, j) => s + (j.transferred || 0), 0);
    const avgMs = completed.length > 0
      ? completed.reduce((s, j) => s + (j.duration_ms || 0), 0) / completed.length : 0;

    const fmt = (ms) => {
      if (!ms) return '—';
      if (ms < 60000) return `${(ms/1000).toFixed(1)}s`;
      if (ms < 3600000) return `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`;
      return `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`;
    };
    const fmtBytes = (b) => {
      if (!b) return '0 B';
      if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
      if (b < 1024*1024*1024) return `${(b/1024/1024).toFixed(2)} MB`;
      return `${(b/1024/1024/1024).toFixed(2)} GB`;
    };

    const now = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    const line = '─'.repeat(60);

    let report = `
DriveMigrate — Admin Report
Generated: ${now} UTC
${line}

SUMMARY
  Total Jobs        : ${jobs.length}
  Completed         : ${completed.length}
  Failed            : ${failed.length}
  Active            : ${jobs.filter(j => ['pending','running'].includes(j.status)).length}
  Total Files Moved : ${totalFiles.toLocaleString()}
  Total Volume      : ${fmtBytes(totalBytes)}
  Avg Duration      : ${fmt(avgMs)}

${line}

JOB DETAILS (last ${Math.min(jobs.length, 50)})

`;

    jobs.slice(0, 50).forEach((job, i) => {
      const duration = fmt(job.duration_ms);
      report += `[${String(i+1).padStart(2,'0')}] ${job.status.toUpperCase().padEnd(10)} ${job.id.slice(0,8)}
     From     : ${job.source_email}
     To       : ${job.dest_email}
     Files    : ${job.transferred || 0} transferred, ${job.failed || 0} failed
     Volume   : ${fmtBytes(job.bytes_transferred)}
     Duration : ${duration}
     Started  : ${job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
${job.error_log?.length ? `     Errors   : ${job.error_log.length} error(s)\n` : ''}
`;
    });

    report += `${line}\nEnd of Report\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.send(report.trim());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
