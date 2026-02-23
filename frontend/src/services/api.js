import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

// AUTH
export const getAccounts = () => api.get('/auth/accounts').then(r => r.data);
export const getConnectUrl = (role) => api.get(`/auth/connect?role=${role}`).then(r => r.data.url);
export const disconnectAccount = (role) => api.delete(`/auth/accounts/${role}`).then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);

// DRIVE
export const listFiles = (role, folderId = 'root', pageToken) => {
  const params = new URLSearchParams({ folderId });
  if (pageToken) params.set('pageToken', pageToken);
  return api.get(`/drive/${role}/files?${params}`).then(r => r.data);
};
export const getStorageInfo = (role) => api.get(`/drive/${role}/storage`).then(r => r.data);

// TRANSFER
export const startTransfer = (selectedItems, options = {}) =>
  api.post('/transfer/start', { selectedItems, options }).then(r => r.data);
export const getTransferJob = (jobId) => api.get(`/transfer/${jobId}`).then(r => r.data);
export const getTransferLogs = (jobId, limit = 50, offset = 0) =>
  api.get(`/transfer/${jobId}/logs?limit=${limit}&offset=${offset}`).then(r => r.data);
export const listJobs = () => api.get('/transfer').then(r => r.data);
