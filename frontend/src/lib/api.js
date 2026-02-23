const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getAuthStatus: () => request('/auth/status'),
  connectAccount: (account) => request(`/auth/connect?account=${account}`),
  disconnectAccount: (account) => request(`/auth/disconnect/${account}`, { method: 'DELETE' }),
  getSourceFolders: () => request('/drive/source/folders'),
  getFolderContents: (folderId) => request(`/drive/source/folders/${folderId}`),
  getSourceQuota: () => request('/drive/source/quota'),
  startTransfer: (selectedItems) => request('/transfer/start', {
    method: 'POST',
    body: JSON.stringify({ selectedItems }),
  }),
  getJobStatus: (jobId) => request(`/transfer/${jobId}`),
};
