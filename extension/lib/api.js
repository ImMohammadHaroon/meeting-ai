import { DEFAULT_API_BASE } from './config.js';

export async function getApiBase() {
  const { apiBase } = await chrome.storage.sync.get(['apiBase']);
  return apiBase || DEFAULT_API_BASE;
}

export async function getToken() {
  const { token } = await chrome.storage.local.get(['token']);
  return token || null;
}

async function apiFetch(path, options = {}) {
  const base = await getApiBase();
  const token = await getToken();
  const headers = { ...(options.headers || {}) };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Request failed');
  }

  return data;
}

export async function signIn(email, password) {
  const data = await apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const token = data.token || data.session?.access_token;
  if (!token) {
    throw new Error('No access token returned');
  }
  await chrome.storage.local.set({ token, user: data.user });
  return data;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export async function signOut() {
  await chrome.storage.local.remove(['token', 'user']);
}

export async function getGoogleMeetOrg() {
  const data = await apiFetch('/organizations/google-meet');
  return data.organization;
}

export async function createMeeting({ title, description, organizationId }) {
  const data = await apiFetch('/meetings', {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      type: 'group',
      organizationId,
      source: 'chrome_extension'
    })
  });
  return data.meeting;
}

export async function uploadExtensionAudio(meetingId, blob, filename = 'meet-recording.webm') {
  const formData = new FormData();
  formData.append('audio', blob, filename);
  return apiFetch(`/meetings/${meetingId}/upload/extension`, {
    method: 'POST',
    body: formData
  });
}

export async function processMeeting(meetingId) {
  return apiFetch(`/meetings/${meetingId}/process`, { method: 'POST' });
}

export async function getMeetingStatus(meetingId) {
  return apiFetch(`/meetings/${meetingId}/status`);
}
