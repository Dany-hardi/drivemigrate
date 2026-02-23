const BASE = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('dm_token') || '';
}

export function setToken(token) {
  localStorage.setItem('dm_token', token);
}

export function clearToken() {
  localStorage.removeItem('dm_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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

  // Pass existing token so backend can merge both accounts into one JWT
  connectAccount: async (account) => {
    const token = getToken();
    const res = await fetch(`${BASE}/auth/connect?account=${account}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('Failed to get auth URL');
    return res.json();
  },

  disconnectAccount: (account) => {
    clearToken();
    return Promise.resolve({ success: true });
  },

  getSourceFolders: () => request('/drive/source/folders'),
  getFolderContents: (folderId) => request(`/drive/source/folders/${folderId}`),
  getSourceQuota: () => request('/drive/source/quota'),
  startTransfer: (selectedItems) => request('/transfer/start', {
    method: 'POST',
    body: JSON.stringify({ selectedItems }),
  }),
  getJobStatus: (jobId) => request(`/transfer/${jobId}`),
};
