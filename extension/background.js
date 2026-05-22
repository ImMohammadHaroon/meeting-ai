/**
 * MV3 service worker — orchestrates tab capture via getMediaStreamId + offscreen document.
 * chrome.tabCapture.capture() cannot run here; stream ID is obtained here, recording runs offscreen.
 */

import {
  createMeeting,
  getGoogleMeetOrg,
  getToken,
  processMeeting,
  uploadExtensionAudio
} from './lib/api.js';
import { DEFAULT_APP_URL } from './lib/config.js';

const OFFSCREEN_URL = 'offscreen.html';
let recordingTabId = null;

async function hasOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)]
  });
  return contexts.length > 0;
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA'],
    justification: 'Record Google Meet tab audio for Meeting AI transcription'
  });
}

async function closeOffscreenDocument() {
  if (!(await hasOffscreenDocument())) return;
  await chrome.offscreen.closeDocument();
}

function sendToOffscreen(message) {
  return chrome.runtime.sendMessage({ ...message, target: 'offscreen' });
}

async function startRecording(tabId) {
  const token = await getToken();
  if (!token) {
    throw new Error('Sign in via the Meeting AI extension popup first');
  }

  recordingTabId = tabId;

  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  await setupOffscreenDocument();
  await sendToOffscreen({ action: 'START_RECORDING', streamId });
}

async function stopRecordingAndUpload(meta = {}) {
  const response = await sendToOffscreen({ action: 'STOP_RECORDING' });
  await closeOffscreenDocument();

  if (!response?.audioBase64) {
    throw new Error('No recording data received');
  }

  const bytes = Uint8Array.from(atob(response.audioBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: response.mimeType || 'audio/webm' });

  const org = await getGoogleMeetOrg();
  const title =
    meta.title ||
    `Google Meet – ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
  const description = meta.meetUrl
    ? `Recorded from Google Meet\n${meta.meetUrl}`
    : 'Recorded from Google Meet via Chrome extension';

  const meeting = await createMeeting({
    title,
    description,
    organizationId: org.id
  });

  await uploadExtensionAudio(meeting.id, blob);
  await processMeeting(meeting.id);

  const { appUrl } = await chrome.storage.sync.get(['appUrl']);
  const base = appUrl || DEFAULT_APP_URL;

  if (recordingTabId) {
    chrome.tabs.sendMessage(recordingTabId, {
      action: 'UPLOAD_COMPLETE',
      meetingId: meeting.id,
      meetingUrl: `${base}/meetings/${meeting.id}`
    }).catch(() => {});
  }

  recordingTabId = null;

  return { meetingId: meeting.id, meetingUrl: `${base}/meetings/${meeting.id}` };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = async () => {
    if (message.target === 'offscreen') {
      return false;
    }

    switch (message.action) {
      case 'GET_AUTH_STATUS': {
        const token = await getToken();
        return { signedIn: !!token };
      }

      case 'START_RECORDING': {
        const tabId = message.tabId ?? sender.tab?.id;
        if (!tabId) throw new Error('No tab ID for recording');
        await startRecording(tabId);
        if (tabId) {
          chrome.tabs.sendMessage(tabId, { action: 'RECORDING_STARTED' }).catch(() => {});
        }
        return { ok: true };
      }

      case 'STOP_RECORDING': {
        const result = await stopRecordingAndUpload({
          title: message.title,
          meetUrl: message.meetUrl
        });
        return { ok: true, ...result };
      }

      case 'RECORDING_ERROR': {
        await closeOffscreenDocument();
        recordingTabId = null;
        if (message.tabId) {
          chrome.tabs.sendMessage(message.tabId, {
            action: 'RECORDING_ERROR',
            error: message.error
          }).catch(() => {});
        }
        return { ok: false };
      }

      default:
        return undefined;
    }
  };

  handler()
    .then((result) => {
      if (result !== undefined) sendResponse(result);
    })
    .catch((err) => {
      console.error('[Meeting AI]', err);
      sendResponse({ ok: false, error: err.message });
    });

  return true;
});
