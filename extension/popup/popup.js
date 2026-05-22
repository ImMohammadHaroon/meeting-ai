import { signIn, signOut, getMe, getToken } from '../lib/api.js';
import { DEFAULT_API_BASE, DEFAULT_APP_URL } from '../lib/config.js';

const signedOut = document.getElementById('signed-out');
const signedIn = document.getElementById('signed-in');
const signinForm = document.getElementById('signin-form');
const errorEl = document.getElementById('error');
const userEmailEl = document.getElementById('user-email');
const apiBaseInput = document.getElementById('api-base');
const appUrlInput = document.getElementById('app-url');

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

function setView(isSignedIn, email = '') {
  signedOut.hidden = isSignedIn;
  signedIn.hidden = !isSignedIn;
  if (email) userEmailEl.textContent = email;
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get(['apiBase', 'appUrl']);
  apiBaseInput.value = stored.apiBase || DEFAULT_API_BASE;
  appUrlInput.value = stored.appUrl || DEFAULT_APP_URL;
}

async function init() {
  await loadSettings();

  const token = await getToken();
  if (token) {
    try {
      const { user } = await getMe();
      setView(true, user?.email);
    } catch {
      await signOut();
      setView(false);
    }
  } else {
    setView(false);
  }
}

signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const btn = document.getElementById('signin-btn');
  btn.disabled = true;

  try {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const data = await signIn(email, password);
    setView(true, data.user?.email || email);
    signinForm.reset();
  } catch (err) {
    showError(err.message || 'Sign in failed');
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('signout-btn').addEventListener('click', async () => {
  await signOut();
  setView(false);
});

document.getElementById('save-settings').addEventListener('click', async () => {
  await chrome.storage.sync.set({
    apiBase: apiBaseInput.value.trim() || DEFAULT_API_BASE,
    appUrl: appUrlInput.value.trim() || DEFAULT_APP_URL
  });
  showError('');
  const prev = errorEl.textContent;
  showError('Settings saved');
  setTimeout(() => showError(prev === 'Settings saved' ? '' : prev), 2000);
});

init();
