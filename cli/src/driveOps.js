import { Readable } from 'stream';

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

export async function listFolders(drive) {
  const res = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false and 'me' in owners",
    pageSize: 100,
    fields: 'files(id, name)',
  });
  return res.data.files || [];
}

export async function listFolderContents(drive, folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize: 200,
    fields: 'files(id, name, mimeType, size)',
  });
  return res.data.files || [];
}

export async function downloadFile(drive, file) {
  const exp = EXPORT_MAP[file.mimeType];
  if (exp) {
    const res = await drive.files.export({ fileId: file.id, mimeType: exp.mimeType }, { responseType: 'arraybuffer' });
    return { buffer: Buffer.from(res.data), mimeType: exp.mimeType, name: file.name + exp.ext };
  }
  const res = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
  return { buffer: Buffer.from(res.data), mimeType: file.mimeType, name: file.name };
}

export async function uploadFile(drive, { buffer, mimeType, name }, parentId) {
  await drive.files.create({
    requestBody: { name, parents: parentId ? [parentId] : [] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id',
  });
}

export async function createFolder(drive, name, parentId) {
  const res = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] },
    fields: 'id, name',
  });
  return res.data;
}
