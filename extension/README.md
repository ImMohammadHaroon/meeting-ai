# Meeting AI — Chrome Extension

Record Google Meet tab audio and send it to Meeting AI for transcription and AI-generated notes.

**Full documentation:** [EXTENSION_DOCUMENTATION.md](./EXTENSION_DOCUMENTATION.md)

---

## Quick start

1. Run the Meeting AI backend (`http://localhost:5000`)
2. `chrome://extensions` → **Developer mode** → **Load unpacked** → select this `extension/` folder
3. Extension popup → **Settings** → API URL: `http://localhost:5000/api`, App URL: `http://localhost:5173`
4. Sign in with your Meeting AI account
5. Open [Google Meet](https://meet.google.com) → **Record with Meeting AI** → stop to upload

Recordings appear under the **Google Meet** organization in the web dashboard.

---

## Architecture (summary)

MV3 cannot call `chrome.tabCapture.capture()` in the service worker. Flow:

1. **Content script** — user clicks record (gesture)
2. **Service worker** — `getMediaStreamId(tabId)`
3. **Offscreen document** — `getUserMedia` + `MediaRecorder`
4. **API** — create meeting → upload WebM → process

See [EXTENSION_DOCUMENTATION.md §3](./EXTENSION_DOCUMENTATION.md#3-how-it-works) for diagrams and details.

---

## Docs index

| Document | Contents |
|----------|----------|
| [EXTENSION_DOCUMENTATION.md](./EXTENSION_DOCUMENTATION.md) | Complete guide: install, API, security, troubleshooting, FAQ |
| [migrations/add_source_column.sql](./migrations/add_source_column.sql) | Optional `meetings.source` column |

---

## API endpoints (extension)

| Method | Path |
|--------|------|
| POST | `/api/auth/signin` |
| GET | `/api/auth/me` |
| GET | `/api/organizations/google-meet` |
| POST | `/api/meetings` |
| POST | `/api/meetings/:id/upload/extension` |
| POST | `/api/meetings/:id/process` |

Production API URL example: `https://meeting-ai-3kyx.onrender.com/api`
