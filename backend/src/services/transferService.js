const { listFiles, downloadFile, uploadFile, createFolder, GOOGLE_MIME_EXPORTS } = require('./driveService');
const { getDB } = require('../utils/db');

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * Recursively count all files under a set of selected items
 */
async function countFiles(sourceTokens, itemIds) {
  let count = 0;
  let bytes = 0;

  async function walk(folderId) {
    let pageToken = null;
    do {
      const data = await listFiles(sourceTokens, { folderId, pageToken });
      for (const file of data.files) {
        if (file.mimeType === FOLDER_MIME) {
          await walk(file.id);
        } else {
          count++;
          bytes += parseInt(file.size || 0);
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  }

  for (const item of itemIds) {
    if (item.mimeType === FOLDER_MIME) {
      await walk(item.id);
    } else {
      count++;
      bytes += parseInt(item.size || 0);
    }
  }

  return { count, bytes };
}

/**
 * Main migration runner - called by the Bull worker
 */
async function runMigration({ jobId, sourceTokens, destTokens, selectedItems, options = {} }) {
  const db = getDB();

  function log(level, message, fileInfo = {}) {
    db.prepare(
      'INSERT INTO job_logs (job_id, level, message, file_name, file_id) VALUES (?, ?, ?, ?, ?)'
    ).run(jobId, level, message, fileInfo.name || null, fileInfo.id || null);
  }

  function updateJob(fields) {
    const keys = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = Object.values(fields);
    db.prepare(`UPDATE jobs SET ${keys} WHERE id = ?`).run(...vals, jobId);
  }

  // Map: sourceId -> destId (for folder tree)
  const folderMap = {};

  /**
   * Transfer a single file
   */
  async function transferFile(file, destParentId) {
    try {
      const exportInfo = GOOGLE_MIME_EXPORTS[file.mimeType];
      const { stream, exportedMimeType, ext } = await downloadFile(sourceTokens, file.id, file.mimeType);
      const destName = exportInfo ? file.name + ext : file.name;

      await uploadFile(destTokens, {
        name: destName,
        mimeType: exportedMimeType,
        parentId: destParentId || null,
        stream,
        size: file.size,
      });

      log('info', `Transferred: ${file.name}`, file);
      updateJob({
        transferred_files: db.prepare('SELECT transferred_files FROM jobs WHERE id = ?').get(jobId).transferred_files + 1,
        transferred_bytes: db.prepare('SELECT transferred_bytes FROM jobs WHERE id = ?').get(jobId).transferred_bytes + parseInt(file.size || 0),
      });
    } catch (err) {
      log('error', `Failed: ${file.name} — ${err.message}`, file);
      updateJob({
        failed_files: db.prepare('SELECT failed_files FROM jobs WHERE id = ?').get(jobId).failed_files + 1,
      });
    }
  }

  /**
   * Recursively transfer a folder
   */
  async function transferFolder(sourceFolderId, sourceFolderName, destParentId) {
    // Create folder in destination
    let destFolder;
    try {
      destFolder = await createFolder(destTokens, {
        name: sourceFolderName,
        parentId: destParentId || null,
      });
      folderMap[sourceFolderId] = destFolder.id;
      log('info', `Created folder: ${sourceFolderName}`);
    } catch (err) {
      log('error', `Failed to create folder: ${sourceFolderName} — ${err.message}`);
      return;
    }

    let pageToken = null;
    do {
      const data = await listFiles(sourceTokens, { folderId: sourceFolderId, pageToken });
      for (const item of data.files) {
        if (item.mimeType === FOLDER_MIME) {
          await transferFolder(item.id, item.name, destFolder.id);
        } else {
          await transferFile(item, destFolder.id);
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  }

  // ---- MAIN FLOW ----
  try {
    updateJob({ status: 'running', started_at: new Date().toISOString() });
    log('info', 'Migration started');

    for (const item of selectedItems) {
      if (item.mimeType === FOLDER_MIME) {
        await transferFolder(item.id, item.name, null);
      } else {
        await transferFile(item, null);
      }
    }

    updateJob({ status: 'completed', completed_at: new Date().toISOString() });
    log('info', 'Migration completed successfully');
  } catch (err) {
    updateJob({ status: 'failed', error: err.message, completed_at: new Date().toISOString() });
    log('error', `Migration failed: ${err.message}`);
    throw err;
  }
}

module.exports = { runMigration, countFiles };
