/**
 * Injects "Record with Meeting AI" into Google Meet.
 * User gesture here → background gets stream ID → offscreen records tab audio.
 */

const BTN_ID = 'meeting-ai-record-btn';
const TOAST_ID = 'meeting-ai-toast';

let isRecording = false;
let isUploading = false;

function showToast(text, html = false) {
  let toast = document.getElementById(TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = TOAST_ID;
    document.body.appendChild(toast);
  }
  if (html) {
    toast.innerHTML = text;
  } else {
    toast.textContent = text;
  }
  toast.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, html ? 12000 : 5000);
}

function getMeetTitle() {
  const heading = document.querySelector('[data-meeting-title]') ||
    document.querySelector('h1') ||
    document.title;
  const text = heading?.textContent?.trim() || document.title.replace(/ - Google Meet$/, '');
  return text || 'Google Meet';
}

function findToolbarAnchor() {
  return (
    document.querySelector('[jsname="EaZ7Sc"]') ||
    document.querySelector('[data-is-muted]')?.closest('[role="toolbar"]') ||
    document.querySelector('[aria-label*="microphone" i]')?.closest('div')?.parentElement ||
    document.querySelector('header') ||
    document.body
  );
}

function injectButton() {
  if (document.getElementById(BTN_ID)) return;

  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="6"/>
    </svg>
    <span>Record with Meeting AI</span>
  `;

  btn.addEventListener('click', onRecordClick);

  const anchor = findToolbarAnchor();
  if (anchor === document.body) {
    btn.style.position = 'fixed';
    btn.style.bottom = '80px';
    btn.style.right = '24px';
    document.body.appendChild(btn);
  } else {
    anchor.prepend(btn);
  }
}

async function onRecordClick() {
  const btn = document.getElementById(BTN_ID);
  if (isUploading) return;

  if (!isRecording) {
    const { signedIn } = await chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' });
    if (!signedIn) {
      showToast('Sign in via the Meeting AI extension popup first.');
      return;
    }

    btn.disabled = true;
    const res = await chrome.runtime.sendMessage({
      action: 'START_RECORDING',
      tabId: null
    });

    btn.disabled = false;

    if (!res?.ok) {
      showToast(res?.error || 'Could not start recording');
      return;
    }

    isRecording = true;
    btn.classList.add('meeting-ai-recording');
    btn.querySelector('span').textContent = 'Stop & upload to Meeting AI';
    showToast('Recording… Capture includes all meeting audio on this tab.');
    return;
  }

  isRecording = false;
  isUploading = true;
  btn.disabled = true;
  btn.classList.remove('meeting-ai-recording');
  btn.classList.add('meeting-ai-uploading');
  btn.querySelector('span').textContent = 'Uploading…';

  showToast('Stopping recording and uploading to Meeting AI…');

  const res = await chrome.runtime.sendMessage({
    action: 'STOP_RECORDING',
    title: `${getMeetTitle()} – ${new Date().toLocaleDateString()}`,
    meetUrl: window.location.href
  });

  btn.disabled = false;
  btn.classList.remove('meeting-ai-uploading');
  isUploading = false;
  btn.querySelector('span').textContent = 'Record with Meeting AI';

  if (!res?.ok) {
    showToast(res?.error || 'Upload failed');
    return;
  }

  showToast(
    `Uploaded! Processing started. <a href="${res.meetingUrl}" target="_blank" rel="noopener">View meeting</a>`,
    true
  );
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'RECORDING_STARTED') {
    return;
  }
  if (message.action === 'UPLOAD_COMPLETE') {
    showToast(
      `Done! <a href="${message.meetingUrl}" target="_blank" rel="noopener">Open in Meeting AI</a>`,
      true
    );
  }
  if (message.action === 'RECORDING_ERROR') {
    isRecording = false;
    isUploading = false;
    const btn = document.getElementById(BTN_ID);
    if (btn) {
      btn.classList.remove('meeting-ai-recording', 'meeting-ai-uploading');
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Record with Meeting AI';
    }
    showToast(message.error || 'Recording error');
  }
});

function init() {
  injectButton();
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BTN_ID)) injectButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
