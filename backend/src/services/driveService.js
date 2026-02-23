import { google } from 'googleapis';
import { createOAuthClient } from './googleAuth.js';

/**
 * Build a Drive client from stored tokens
 */
export function getDriveClient(tokens) {
  const auth = createOAuthClient();
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
}

/**
 * List all files/folders a user owns, paginated
 */
export async function listAllFiles(driveClient, query = '') {
  const files = [];
  let pageToken = null;
  const baseQuery = query || "trashed = false and 'me' in owners";

  do {
    const res = await driveClient.files.list({
      q: baseQuery,
      pageSize: 200,
      fields: 'nextPageToken, files(id, name, mimeType, size, parents, modifiedTime)',
      pageToken: pageToken || undefined,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

/**
 * List top-level folders for the selection UI
 */
export async function listFolders(driveClient) {
  const res = await driveClient.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false and 'me' in owners",
    pageSize: 100,
    fields: 'files(id, name, mimeType, modifiedTime)',
  });
  return res.data.files || [];
}

/**
 * List children of a folder
 */
export async function listFolderContents(driveClient, folderId) {
  const res = await driveClient.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize: 200,
    fields: 'files(id, name, mimeType, size, modifiedTime)',
  });
  return res.data.files || [];
}

// Google Workspace MIME types → export formats
const EXPORT_MAP = {
  'application/vnd.google-apps.document': {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: '.docx',
  },
  'application/vnd.google-apps.spreadsheet': {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: '.xlsx',
  },
  'application/vnd.google-apps.presentation': {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ext: '.pptx',
  },
};

/**
 * Download a file as a Buffer.
 * Google Workspace files are exported; others are downloaded directly.
 */
export async function downloadFile(driveClient, file) {
  const exportFormat = EXPORT_MAP[file.mimeType];

  if (exportFormat) {
    const res = await driveClient.files.export(
      { fileId: file.id, mimeType: exportFormat.mimeType },
      { responseType: 'arraybuffer' }
    );
    return {
      buffer: Buffer.from(res.data),
      mimeType: exportFormat.mimeType,
      name: file.name + exportFormat.ext,
    };
  }

  const res = await driveClient.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return {
    buffer: Buffer.from(res.data),
    mimeType: file.mimeType,
    name: file.name,
  };
}

/**
 * Upload a file Buffer to a destination Drive
 */
export async function uploadFile(driveClient, { buffer, mimeType, name }, parentId = null) {
  const { Readable } = await import('stream');
  const stream = Readable.from(buffer);

  const res = await driveClient.files.create({
    requestBody: {
      name,
      parents: parentId ? [parentId] : [],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name',
  });
  return res.data;
}

/**
 * Create a folder in destination drive, return its ID
 */
export async function createFolder(driveClient, name, parentId = null) {
  const res = await driveClient.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id, name',
  });
  return res.data;
}
