import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { google } from 'googleapis';
import { createOAuthClient } from '../services/googleAuth.js';
import { initDb, updateJob } from '../services/db.js';
import { downloadFile, uploadFile, createFolder } from '../services/driveService.js';

initDb();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('connect', () => console.log('Worker connected to Redis'));
connection.on('error', (err) => console.error('Redis error:', err.message));

function buildDriveClient(tokens) {
  const auth = createOAuthClient();
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
}

async function migrateFolder(sourceDrive, destDrive, sourceFolderId, destParentId, stats, errorLog, jobId) {
  const { data } = await sourceDrive.files.list({
    q: `'${sourceFolderId}' in parents and trashed = false`,
    pageSize: 200,
    fields: 'files(id, name, mimeType, size)',
  });

  for (const file of data.files || []) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      try {
        const newFolder = await createFolder(destDrive, file.name, destParentId);
        await migrateFolder(sourceDrive, destDrive, file.id, newFolder.id, stats, errorLog, jobId);
      } catch (err) {
        stats.failed++;
        errorLog.push({ file: file.name, error: err.message });
      }
    } else {
      try {
        const downloaded = await downloadFile(sourceDrive, file);
        await uploadFile(destDrive, downloaded, destParentId);
        stats.transferred++;
      } catch (err) {
        stats.failed++;
        errorLog.push({ file: file.name, error: err.message });
      }
    }
    await updateJob(jobId, { transferred: stats.transferred, failed: stats.failed, error_log: errorLog });
  }
}

const worker = new Worker('transfer', async (job) => {
  const { jobId, sourceTokens, destTokens, selectedItems } = job.data;
  console.log(`Starting job ${jobId}`);

  const sourceDrive = buildDriveClient(sourceTokens);
  const destDrive = buildDriveClient(destTokens);

  await updateJob(jobId, { status: 'running' });

  const stats = { transferred: 0, failed: 0, skipped: 0 };
  const errorLog = [];

  for (const item of selectedItems) {
    try {
      if (item.type === 'folder') {
        const newFolder = await createFolder(destDrive, item.name, null);
        await migrateFolder(sourceDrive, destDrive, item.id, newFolder.id, stats, errorLog, jobId);
      } else {
        const fileRes = await sourceDrive.files.get({ fileId: item.id, fields: 'id, name, mimeType' });
        const downloaded = await downloadFile(sourceDrive, fileRes.data);
        await uploadFile(destDrive, downloaded, null);
        stats.transferred++;
      }
    } catch (err) {
      stats.failed++;
      errorLog.push({ file: item.name, error: err.message });
    }
    await updateJob(jobId, { transferred: stats.transferred, failed: stats.failed, error_log: errorLog });
  }

  const finalStatus = stats.failed > 0 && stats.transferred === 0 ? 'failed' : 'completed';
  await updateJob(jobId, { status: finalStatus, transferred: stats.transferred, failed: stats.failed, error_log: errorLog });
  console.log(`Job ${jobId} ${finalStatus}`);

}, { connection, concurrency: 2 });

worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));
console.log('Transfer worker running...');
