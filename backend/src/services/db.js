import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const JOB_TTL = 60 * 60 * 24 * 7; // 7 days

export function initDb() {
  console.log('Using Redis for job storage');
}

export async function createJob(id, sourceEmail, destEmail, selectedItems) {
  const job = {
    id,
    source_email: sourceEmail,
    dest_email: destEmail,
    status: 'pending',
    total_files: selectedItems.length,
    transferred: 0,
    failed: 0,
    skipped: 0,
    bytes_transferred: 0,
    selected_items: selectedItems,
    error_log: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    duration_ms: null,
  };
  await redis.setex(`job:${id}`, JOB_TTL, JSON.stringify(job));
  return job;
}

export async function getJob(id) {
  const data = await redis.get(`job:${id}`);
  if (!data) return null;
  return JSON.parse(data);
}

export async function updateJob(id, fields) {
  const job = await getJob(id);
  if (!job) return;

  // Auto-set started_at when status becomes running
  if (fields.status === 'running' && !job.started_at) {
    fields.started_at = new Date().toISOString();
  }

  // Auto-set completed_at and duration when job finishes
  if (['completed', 'failed'].includes(fields.status) && !job.completed_at) {
    fields.completed_at = new Date().toISOString();
    const start = job.started_at || job.created_at;
    fields.duration_ms = new Date(fields.completed_at) - new Date(start);
  }

  const updated = { ...job, ...fields, updated_at: new Date().toISOString() };
  await redis.setex(`job:${id}`, JOB_TTL, JSON.stringify(updated));
}
