import { google } from 'googleapis';
import { createOAuthClient } from './googleAuth.js';

export function getDriveClient(tokens) {
  const auth = createOAuthClient();
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
}

// List ALL files and folders recursively from root
export async function listAllFiles(driveClient) {
  const files = [];
  let pageToken = null;
  do {
    const res = await driveClient.files.list({
      q: "trashed = false and 'root' in parents",
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
      orderBy: 'folder,name',
      pageToken: pageToken || undefined,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

export async function listFolders(driveClient) {
  return listAllFiles(driveClient);
}

export async function listFolderContents(driveClient, folderId) {
  const files = [];
  let pageToken = null;
  do {
    const res = await driveClient.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 1000,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
      orderBy: 'folder,name',
      pageToken: pageToken || undefined,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return files;
}

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

export async function downloadFile(driveClient, file) {
  const exportFormat = EXPORT_MAP[file.mimeType];
  if (exportFormat) {
    const res = await driveClient.files.export(
      { fileId: file.id, mimeType: exportFormat.mimeType },
      { responseType: 'arraybuffer' }
    );
    const buffer = Buffer.from(res.data);
    return { buffer, mimeType: exportFormat.mimeType, name: file.name + exportFormat.ext, size: buffer.length };
  }
  const res = await driveClient.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  const buffer = Buffer.from(res.data);
  return { buffer, mimeType: file.mimeType, name: file.name, size: buffer.length };
}

export async function uploadFile(driveClient, { buffer, mimeType, name, size }, parentId = null) {
  const { Readable } = await import('stream');
  const stream = Readable.from(buffer);
  const res = await driveClient.files.create({
    requestBody: { name, parents: parentId ? [parentId] : [] },
    media: { mimeType, body: stream },
    fields: 'id, name',
  });
  return { ...res.data, size: size || buffer.length };
}

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

export async function listRootContents(driveClient) {
  return listAllFiles(driveClient);
}
