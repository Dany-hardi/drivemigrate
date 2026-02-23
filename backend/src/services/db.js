import IORedis from 'ioredis';

// Use Redis for job storage so backend and worker share the same state
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const JOB_TTL = 60 * 60 * 24; // 24 hours

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
    selected_items: selectedItems,
    error_log: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  const updated = { ...job, ...fields, updated_at: new Date().toISOString() };
  await redis.setex(`job:${id}`, JOB_TTL, JSON.stringify(updated));
}
