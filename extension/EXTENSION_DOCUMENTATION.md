# Meeting AI Chrome Extension — Full Documentation

> **Manifest V3** extension that records Google Meet tab audio and sends it to your Meeting AI backend for transcription (Groq Whisper) and notes/tasks (LLaMA 3.3).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [How It Works](#3-how-it-works)
4. [Project Structure](#4-project-structure)
5. [Installation](#5-installation)
6. [User Guide](#6-user-guide)
7. [Configuration](#7-configuration)
8. [Backend Integration](#8-backend-integration)
9. [API Reference](#9-api-reference)
10. [Database](#10-database)
11. [Permissions & Security](#11-permissions--security)
12. [Development](#12-development)
13. [Production Deployment](#13-production-deployment)
14. [Troubleshooting](#14-troubleshooting)
15. [FAQ](#15-faq)

---

## 1. Overview

The **Meeting AI for Google Meet** Chrome extension lets signed-in users:

1. Open a Google Meet call
2. Click **Record with Meeting AI** (injected into the Meet UI)
3. Record **all audio on the Meet tab** (every participant heard through your speakers/headphones)
4. Stop recording → audio uploads automatically
5. Backend transcribes and generates notes/tasks
6. View results in the web dashboard under the **Google Meet** organization

Extension recordings are stored as **group meetings** (`type: 'group'`) with a single WebM audio file.

---

## 2. Features

| Feature | Description |
|---------|-------------|
| **One-click recording** | Button injected on `meet.google.com` |
| **Tab audio capture** | Captures full meeting mix from the tab (not just your mic) |
| **Auto organization** | Creates/uses a **Google Meet** org per user |
| **AI pipeline** | Same upload → transcribe → notes → tasks flow as the web app |
| **Dashboard badge** | Meetings tagged with **Google Meet** on the dashboard |
| **Configurable API** | Point at localhost or production backend via popup settings |
| **JWT auth** | Uses existing Meeting AI email/password sign-in |

---

## 3. How It Works

### Why not `tabCapture.capture()` in the service worker?

In **Manifest V3**, `chrome.tabCapture.capture()` cannot be called from the background service worker. The supported pattern is:

1. Obtain a **stream ID** with `chrome.tabCapture.getMediaStreamId({ targetTabId })` (after a user gesture)
2. Pass that ID to an **offscreen document**
3. Call `navigator.mediaDevices.getUserMedia()` there with `chromeMediaSource: 'tab'`
4. Record with `MediaRecorder` → WebM blob → upload

### End-to-end flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Google Meet (meet.google.com)                                        │
│  ┌──────────────────────┐                                              │
│  │ content/meet.js      │  User clicks "Record with Meeting AI"       │
│  └──────────┬───────────┘                                              │
└─────────────┼───────────────────────────────────────────────────────────┘
              │ chrome.runtime.sendMessage
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  background.js (service worker)                                        │
│  • getMediaStreamId(tabId)                                               │
│  • create offscreen document if needed                                   │
│  • on stop: create meeting → upload → process                            │
└─────────────┬───────────────────────────────┬───────────────────────────┘
              │ streamId                        │ fetch + JWT
              ▼                                 ▼
┌─────────────────────────────┐    ┌──────────────────────────────────────┐
│  offscreen.js               │    │  Meeting AI Backend (Express)       │
│  • getUserMedia(tab audio)  │    │  POST /meetings                      │
│  • MediaRecorder → WebM     │    │  POST /meetings/:id/upload/extension │
└─────────────────────────────┘    │  POST /meetings/:id/process          │
                                   └──────────────────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────────────────┐
                                   │  Groq Whisper + LLaMA 3.3            │
                                   │  Supabase Storage + PostgreSQL         │
                                   └──────────────────────────────────────┘
```

### Recording lifecycle

| Phase | UI state | What happens |
|-------|----------|--------------|
| Idle | Purple button: "Record with Meeting AI" | Waiting for click |
| Recording | Red pulsing: "Stop & upload to Meeting AI" | Offscreen `MediaRecorder` active |
| Uploading | Cyan: "Uploading…" | Blob → API → processing started |
| Done | Toast with link | Open meeting in web app |

---

## 4. Project Structure

```
extension/
├── manifest.json              # MV3 manifest, permissions, content scripts
├── background.js              # Service worker: stream ID, upload orchestration
├── offscreen.html             # Offscreen document shell
├── offscreen.js               # Tab audio capture + MediaRecorder
├── content/
│   ├── meet.js                # Injects record button on Google Meet
│   └── meet.css               # Button + toast styles
├── popup/
│   ├── popup.html             # Sign-in UI + settings
│   ├── popup.css
│   └── popup.js
├── lib/
│   ├── api.js                 # HTTP client (fetch + JWT)
│   └── config.js              # Default URLs
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── migrations/
│   └── add_source_column.sql  # Optional Supabase migration
├── README.md                  # Quick start
└── EXTENSION_DOCUMENTATION.md # This file
```

### Message actions (extension internal)

| Action | Sender | Handler | Purpose |
|--------|--------|---------|---------|
| `GET_AUTH_STATUS` | Content / popup | `background.js` | Check if JWT stored |
| `START_RECORDING` | `meet.js` | `background.js` → `offscreen.js` | Begin capture |
| `STOP_RECORDING` | `meet.js` | `background.js` → upload | End + upload |
| `RECORDING_STARTED` | Background | `meet.js` | UI feedback |
| `UPLOAD_COMPLETE` | Background | `meet.js` | Success toast + link |
| `RECORDING_ERROR` | Background | `meet.js` | Error toast |

---

## 5. Installation

### Prerequisites

- **Google Chrome** (or Chromium-based browser with MV3 support)
- Meeting AI **backend** running and reachable
- A Meeting AI **user account** (email/password)

### Step 1 — Backend

```bash
cd backend
npm install
npm run dev   # default http://localhost:5000
```

Ensure CORS allows Chrome extensions (already configured in `backend/src/server.js` for `chrome-extension://` origins).

### Step 2 — Load extension (development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder in this repo
5. Pin **Meeting AI for Google Meet** to the toolbar

### Step 3 — Configure & sign in

1. Click the extension icon
2. Expand **Settings**
3. Set **API URL** and **App URL** (see [Configuration](#7-configuration))
4. Sign in with your Meeting AI credentials

### Step 4 — Optional database migration

Run in Supabase SQL editor:

```sql
-- extension/migrations/add_source_column.sql
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS source text;
```

Without this column, meetings still work; the backend omits `source` on insert if the column is missing.

---

## 6. User Guide

### Signing in

1. Click the extension icon in the toolbar
2. Enter the same **email** and **password** you use on [meetingai.dev](https://meetingai.dev) or your local app
3. When signed in, you’ll see: `Signed in as your@email.com`

### Recording a Google Meet

1. Join or start a meeting at **https://meet.google.com**
2. Look for the purple **Record with Meeting AI** button (near Meet controls, or fixed bottom-right)
3. Click **Record** — you must be signed in
4. Conduct your meeting normally (audio is captured from the tab)
5. Click **Stop & upload to Meeting AI** when finished
6. Wait for the success toast → **View meeting** opens the dashboard detail page
7. Processing may take 1–3 minutes depending on length

### Viewing recordings in the dashboard

1. Open the Meeting AI web app
2. Switch organization to **Google Meet** (organization switcher in header)
3. Meetings show a **Google Meet** badge when recorded via the extension
4. Open a meeting for transcript, notes, and tasks

### Signing out

Open the popup → **Sign out**. This clears the stored JWT from extension storage.

---

## 7. Configuration

Settings are stored in `chrome.storage.sync` (syncs across Chrome profiles if sync is enabled).

| Setting | Storage key | Default (development) | Production example |
|---------|-------------|----------------------|-------------------|
| API URL | `apiBase` | `http://localhost:5000/api` | `https://meeting-ai-3kyx.onrender.com/api` |
| App URL | `appUrl` | `http://localhost:5173` | `https://meetingai.dev` |

Auth token is stored in `chrome.storage.local` as `token` (Supabase JWT `access_token`).

### Environment matrix

| Environment | API URL | App URL |
|-------------|---------|---------|
| Local dev | `http://localhost:5000/api` | `http://localhost:5173` |
| Production | `https://meeting-ai-3kyx.onrender.com/api` | `https://meetingai.dev` |

---

## 8. Backend Integration

The extension uses **existing** Meeting AI APIs plus a few **additive** backend changes (no breaking changes).

### Backend files touched

| File | Change |
|------|--------|
| `backend/src/server.js` | Allow `chrome-extension://` CORS origins |
| `backend/src/routes/auth.js` | Sign-in response includes `token` field |
| `backend/src/routes/meetings.js` | `source` on create, WebM support, `POST /:id/upload/extension` |
| `backend/src/routes/organizations.js` | `GET /google-meet` — get or create org |

### Google Meet organization

- **Name:** `Google Meet`
- **Slug:** auto-generated (e.g. `google-meet`, `google-meet-1`)
- **Created:** on first extension recording per user via `GET /api/organizations/google-meet`
- User is added as **admin** of that org

### Meeting creation (extension)

```json
POST /api/meetings
{
  "title": "My Meet – 5/21/2026",
  "description": "Recorded from Google Meet\nhttps://meet.google.com/...",
  "type": "group",
  "organizationId": "<google-meet-org-uuid>",
  "source": "chrome_extension"
}
```

### Upload format

```http
POST /api/meetings/:id/upload/extension
Content-Type: multipart/form-data
Authorization: Bearer <jwt>

Field: audio (file) — WebM, max 100MB
```

Meeting **must** be `type: 'group'` for extension upload.

---

## 9. API Reference

### Authentication

#### `POST /api/auth/signin`

**Request:**
```json
{ "email": "user@company.com", "password": "..." }
```

**Response:**
```json
{
  "message": "Signed in successfully",
  "user": { "id": "...", "email": "..." },
  "session": { "access_token": "...", "..." },
  "token": "<same as access_token>"
}
```

Extension stores `token` for all subsequent requests.

#### `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `{ "user": { ... } }`

---

### Organizations

#### `GET /api/organizations/google-meet`

**Headers:** `Authorization: Bearer <token>`

**Response (existing org):**
```json
{ "organization": { "id": "...", "name": "Google Meet", "slug": "google-meet", ... } }
```

**Response (new org):** `201` with same shape.

---

### Meetings

#### `POST /api/meetings`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | From Meet title + date |
| `description` | string | no | Includes Meet URL |
| `type` | string | yes | Must be `group` for extension |
| `organizationId` | uuid | yes | From google-meet endpoint |
| `source` | string | no | `chrome_extension` |

Also accepts `organization_id` as alias for `organizationId`.

#### `POST /api/meetings/:id/upload/extension`

| Field | Type | Required |
|-------|------|----------|
| `audio` | file | yes |

Allowed: WebM, MP3, WAV, M4A, OGG — max **100MB**.

#### `POST /api/meetings/:id/process`

Starts async transcription + notes + task extraction. Same as web app.

#### `GET /api/meetings/:id/status`

```json
{ "processed": true, "hasTranscript": true, "hasNotes": true }
```

Poll until `processed` is `true` (extension currently does not poll; user checks dashboard).

---

## 10. Database

### Optional `source` column

```sql
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS source text;
```

| Value | Meaning |
|-------|---------|
| `chrome_extension` | Recorded via Chrome extension |
| `null` / omitted | Web app or legacy |

### Related tables (unchanged)

- `organizations` — Google Meet org row
- `organization_members` — user linked as admin
- `meetings` — `type = 'group'`, `audio_file_url` set after upload
- `tasks` — populated after processing

---

## 11. Permissions & Security

### Manifest permissions

| Permission | Required for |
|------------|--------------|
| `storage` | JWT + API/App URL settings |
| `tabCapture` | `getMediaStreamId` for Meet tab |
| `offscreen` | Offscreen recording document |
| `activeTab` | Associate capture with active Meet tab |
| `scripting` | Reserved for future injection needs |

### Host permissions

| Host | Purpose |
|------|---------|
| `https://meet.google.com/*` | Content script + recording |
| `http://localhost:5000/*` | Local API |
| `https://meeting-ai-3kyx.onrender.com/*` | Production API |
| `https://meetingai.dev/*` | Production web app |

### Security notes

- JWT is stored in **extension local storage** (not accessible to web pages)
- Only **your** signed-in account can upload recordings
- Organization membership is verified server-side before creating meetings
- Audio is uploaded over HTTPS in production
- Extension does not inject scripts on non-Meet pages

---

## 12. Development

### Reload after code changes

1. `chrome://extensions` → click **Reload** on Meeting AI extension
2. **Refresh** any open Google Meet tabs (content scripts reload on navigation)

### Debug service worker

1. `chrome://extensions` → **Service worker** → Inspect
2. Console logs prefixed with `[Meeting AI]`

### Debug offscreen document

1. During recording, open `chrome://extensions`
2. Find offscreen target in service worker inspect → Application / targets
3. Or add temporary `console.log` in `offscreen.js`

### Debug content script

1. On Meet tab → DevTools (F12) → Console
2. Filter for errors from `meet.js`

### Test without a real Meet

Tab capture requires a real `meet.google.com` tab with active media. Use a test call or Google’s preview lobby.

### Change default API URL

Edit `extension/lib/config.js`:

```javascript
export const DEFAULT_API_BASE = 'http://localhost:5000/api';
export const DEFAULT_APP_URL = 'http://localhost:5173';
```

---

## 13. Production Deployment

### Backend

Deploy backend with extension CORS support (already in repo). No extra env vars required for the extension.

### Extension (side-loaded / enterprise)

1. Set production URLs in popup settings, or change defaults in `config.js`
2. Zip the `extension/` folder (exclude `.git`, docs if desired)
3. Distribute via policy or internal wiki

### Chrome Web Store (public)

1. Create [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole)
2. Prepare assets: 128×128 icon, screenshots, privacy policy URL
3. Zip `extension/` contents (not parent folder)
4. Submit for review — declare:
   - **tabCapture** — record meeting audio user explicitly starts
   - **host** — meet.google.com + your API domain
5. Update `manifest.json` `host_permissions` if API domain changes

### Privacy policy points (for store listing)

- Audio is recorded only when user clicks Record
- Audio is sent to **your** Meeting AI server for processing
- No third-party analytics in the extension code

---

## 14. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| “Sign in via popup first” | No JWT | Open popup → sign in |
| Button not visible | Content script not loaded | Refresh Meet tab; reload extension |
| “Could not start recording” | Tab capture denied / wrong tab | Start recording from the Meet tab; check permissions |
| CORS error in popup | Backend not updated or wrong API URL | Pull latest backend; verify `chrome-extension://` allowed |
| 401 on upload | Expired token | Sign out and sign in again |
| 400 on upload | Meeting not `group` type | Should not happen via extension; report bug |
| 413 / file too large | Recording > 100MB | Shorter meeting or increase backend limit |
| No “Google Meet” org in dashboard | Org not switched | Use organization switcher → **Google Meet** |
| Processing stuck | Groq / backend error | Check backend logs; open meeting detail for error notes |
| Empty transcript | Silent tab / no audio | Ensure Meet audio is playing through the tab |

### Verify backend connectivity

```bash
curl http://localhost:5000/api/health
```

### Verify CORS from extension

After sign-in, open service worker console and confirm API calls return 200, not CORS errors.

---

## 15. FAQ

**Does it record my microphone only?**  
No. It captures **tab audio** — the full mix you hear from Google Meet (all participants), as long as audio plays through that browser tab.

**Do other participants know I’m recording?**  
The extension does not notify them. Follow your organization’s recording consent policies.

**Can I use Zoom or Teams?**  
Not currently. Content scripts only run on `meet.google.com`.

**Does it work offline?**  
No. Upload and AI processing require the backend.

**Is the token the same as the web app?**  
Same Supabase JWT from `/api/auth/signin`, but stored separately in the extension (not shared with the web app session automatically).

**Can I use the web app while recording?**  
Yes. Keep the Meet tab open while recording.

**What file format is uploaded?**  
WebM (Opus), typically `audio/webm;codecs=opus`.

---

## Quick links

- [Quick start (README)](./README.md)
- [Main project docs](../PROJECT_DOCUMENTATION.md)
- [SQL migration](./migrations/add_source_column.sql)

---

*Version 1.0.0 — Manifest V3 — Meeting AI*
