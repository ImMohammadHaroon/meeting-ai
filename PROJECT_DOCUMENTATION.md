# Meeting AI — Project Documentation

> A full-stack, AI-powered meeting management platform that transforms raw audio into transcripts, structured notes, action items, and an interactive Q&A assistant.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Features](#2-core-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Project Structure](#5-project-structure)
6. [Backend Reference](#6-backend-reference)
7. [Frontend Reference](#7-frontend-reference)
8. [Database Schema](#8-database-schema)
9. [REST API Reference](#9-rest-api-reference)
10. [WebSocket / Socket.io Events](#10-websocket--socketio-events)
11. [Environment Variables](#11-environment-variables)
12. [Local Development Setup](#12-local-development-setup)
13. [Deployment](#13-deployment)
14. [Security & Access Control](#14-security--access-control)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Overview

**Meeting AI** is a production-grade web application that helps teams run meetings, capture conversations, and turn them into actionable intelligence. It combines real-time WebRTC audio rooms, audio file uploads, and large-language-model processing to deliver:

- High-fidelity transcription (with auto-translation to English)
- Professionally structured meeting notes
- Auto-extracted, owner-assigned action items
- A contextual Q&A chatbot grounded in meeting content
- Multi-organization workspaces with role-based access

**Live deployment:** [meetingai.dev](https://meetingai.dev)

| Property | Value |
| :--- | :--- |
| Type | Full-stack web application |
| Frontend host | Vercel |
| Backend host | Render |
| Database / Auth / Storage | Supabase (PostgreSQL + RLS) |
| AI provider | Groq (LLaMA 3.3 + Whisper Large v3) |
| Realtime | Socket.io + WebRTC |

---

## 2. Core Features

### 2.1 Authentication & Organizations
- Email/password sign-up and sign-in via **Supabase Auth**.
- Multi-organization model: a user can create or join several orgs.
- Domain-restricted joining (only matching email domains can join an org).
- Invite-code joining + email invitations (SMTP).
- Roles: `admin` and `member`. Admins can invite, regenerate invite codes, and remove members.
- Active organization is persisted in the user's Supabase `user_metadata`.

### 2.2 Meeting Workflows
The platform supports three meeting types:

| Type | Description | Audio Source |
| :--- | :--- | :--- |
| **Standard (Individual)** | One audio file per participant; speaker identity is known. | Multiple uploaded files (one per participant) |
| **Group** | One combined recording with multiple speakers; AI infers speakers. | Single uploaded file |
| **Live** | Real-time audio room with WebRTC; recorded server-side then processed. | Live recording (`webm`) |

### 2.3 AI Processing Pipeline
1. **Transcription** — Groq Whisper Large v3 (`audio.translations.create`) translates any language to English.
2. **Sentence correction** — LLaMA 3.3 70B cleans grammar while preserving meaning.
3. **Notes generation** — LLaMA 3.3 70B produces a structured doc (Summary, Discussion Points, Decisions, Action Items, Next Steps).
4. **Task extraction** — LLaMA 3.3 70B emits JSON with `{title, assigneeId}` mapped to known participants.
5. **Contextual Q&A** — A chat endpoint feeds the transcript, notes, tasks, and recent chat history to LLaMA 3.3 70B.

### 2.4 Live Meeting Rooms
- WebRTC peer-to-peer mesh via Socket.io signaling.
- Mute / unmute, speaking indicator, screen sharing.
- Server records audio, then triggers the same AI pipeline on `end`.
- Optional AI bot participant added to the room.

### 2.5 Collaboration
- Per-meeting **community chat** (humans only) for participants.
- Per-meeting **AI chatbot** that answers using the transcript/notes/tasks as the sole knowledge base.
- Persistent chat history in PostgreSQL.

---

## 3. Tech Stack

### Frontend
| Concern | Technology |
| :--- | :--- |
| Framework | React 19 |
| Build tool | Vite 7 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 3 (custom glassmorphism utilities) |
| Animation / 3D | Framer Motion / Motion / Three.js + React Three Fiber + Drei |
| Icons | lucide-react |
| HTTP | axios |
| Realtime | socket.io-client |
| Audio | RecordRTC, Web Audio APIs |
| Auth client | @supabase/supabase-js |
| Markdown | react-markdown |

### Backend
| Concern | Technology |
| :--- | :--- |
| Runtime | Node.js (ESM) |
| Framework | Express 5 |
| Realtime | Socket.io 4 |
| Auth / DB / Storage | Supabase (PostgreSQL + RLS + Storage bucket) |
| AI SDK | groq-sdk |
| File uploads | multer |
| Email | nodemailer |
| Misc | nanoid (room IDs), cors, dotenv |

---

## 4. System Architecture

```text
                     ┌───────────────────────────┐
                     │        Browser (SPA)      │
                     │  React + Vite + Tailwind  │
                     └─────────────┬─────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │ HTTP (axios / REST)       │ WebSocket (signaling)    │ HTTPS
        ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────────┐   ┌──────────────────┐
│ Supabase Auth   │      │   Express API + Socket.io           │   │      Groq API    │
│  + PostgreSQL   │◀────▶│    (Node.js, ESM)                   │◀─▶│ Whisper + LLaMA │
│  + Storage      │      │  routes/, services/, sockets/        │   │   3.3 (LPU)      │
└─────────────────┘      └─────────────────────┘   └──────────────────┘
                                   ▲
                                   │ peer audio (WebRTC)
                                   ▼
                         ┌──────────────────────┐
                         │ Other browser peers  │
                         └──────────────────────┘
```

### Request flow examples
- **Standard meeting**: Browser uploads N audio files → Backend stores in Supabase Storage → User triggers `process` → Backend transcribes each file with Groq, merges transcripts, generates notes, extracts tasks, persists everything to PostgreSQL.
- **Live meeting**: Browser opens Socket.io connection → joins `room` → exchanges WebRTC offers/answers/ICE → records locally → on `end`, blob is uploaded → backend runs the same AI pipeline.
- **Chat**: Browser sends a message → Backend loads meeting transcript/notes/tasks + last 10 chat turns → Groq returns response → message + response are persisted.

---

## 5. Project Structure

```
meeting-ai/
├── README.md                     # Marketing-style project README
├── PROJECT_DOCUMENTATION.md      # ← this file
├── .github/                      # GitHub workflows / config
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js             # App entrypoint, CORS, routes wiring
│       ├── config/
│       │   ├── supabase.js       # Service-role Supabase client
│       │   └── groq.js           # Groq SDK client
│       ├── middleware/
│       │   └── auth.js           # JWT verification middleware
│       ├── routes/
│       │   ├── auth.js           # /api/auth/*
│       │   ├── users.js          # /api/users
│       │   ├── meetings.js       # /api/meetings/*
│       │   ├── chat.js           # /api/meetings/:id/chat*
│       │   ├── chat_community.js # /api/community-chat/*
│       │   ├── liveMeetings.js   # /api/live-meetings/*
│       │   └── organizations.js  # /api/organizations/*
│       ├── services/
│       │   ├── groqService.js    # Transcription, notes, tasks, chatbot
│       │   ├── storageService.js # Supabase Storage upload/download
│       │   ├── processLiveMeeting.js # Live meeting AI pipeline
│       │   └── email.js          # Invitation emails (nodemailer)
│       └── sockets/
│           └── signalingHandler.js # WebRTC signaling over Socket.io
└── frontend/
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx               # Router + splash + OrganizationProvider
        ├── index.css / App.css
        ├── assets/               # Static images
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── SignIn.jsx
        │   ├── SignUp.jsx
        │   ├── Dashboard.jsx
        │   ├── CreateMeeting.jsx
        │   ├── CreateGroupMeeting.jsx
        │   ├── CreateLiveMeeting.jsx
        │   ├── LiveMeeting.jsx
        │   └── MeetingDetail.jsx
        ├── components/
        │   ├── Chatbot.jsx
        │   ├── OwlSplash.jsx
        │   ├── MobileDrawer.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── OrganizationPanel.jsx
        │   ├── OrganizationSwitcher.jsx
        │   ├── OrganizationSetupModal.jsx
        │   └── ui/               # Reusable UI primitives (glow, demos)
        ├── contexts/
        │   └── OrganizationContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useMediaQuery.js
        │   ├── useAudioRecorder.js
        │   └── useWebRTC.js
        ├── lib/                  # Utilities
        └── services/
            ├── api.js            # axios + REST API helpers
            └── supabase.js       # Browser Supabase client
```

---

## 6. Backend Reference

### 6.1 `server.js`
- Boots Express + an HTTP server, wraps it with a Socket.io server.
- Defines `allowedOrigins` (localhost, `meetingai.dev`, the Vercel + Render URLs, and the `FRONTEND_URL` env var) and a tolerant `isOriginAllowed` matcher (handles `www`/non-`www`, subdomains, `vercel.app` previews).
- Mounts routers under `/api/auth`, `/api/users`, `/api/meetings`, `/api/community-chat`, `/api/live-meetings`, `/api/organizations`.
- Exposes:
  - `GET /api/health` — basic health check.
  - `GET /api/cors-check` — diagnostic endpoint that shows which origin was matched.
- Wires `setupSignalingHandlers(io)` for WebRTC.

### 6.2 Middleware: `middleware/auth.js`
- Reads `Authorization: Bearer <jwt>`.
- Calls `supabase.auth.getUser(token)` to validate.
- Attaches `req.user` (Supabase user object) on success; otherwise 401.

### 6.3 Services

**`services/groqService.js`** — All Groq calls
- `transcribeAudio(buffer, fileName)` — uses `whisper-large-v3` translation endpoint, then runs `correctSentences` for grammar polish.
- `correctSentences(text)` — LLaMA 3.3 70B grammar/clarity rewrite.
- `generateNotes(transcript, title)` — Produces Summary / Key Discussion Points / Decisions / Action Items / Next Steps.
- `extractTasks(transcript, participants)` — Returns `[{title, assigneeId}]` for individual meetings.
- `extractGroupTasks(transcript, participants)` — Same shape, but additionally infers speakers from a single combined transcript.
- `chatWithContext(message, context, chatHistory)` — Q&A bot grounded in transcript/notes/tasks plus the last 10 chat turns.

**`services/storageService.js`**
- `uploadAudioFile(file, meetingId, participantId)` — uploads to the `meeting-audio` bucket under `meetingId/participantId_timestamp_originalname`, returns public URL, cleans up the local temp file.
- `downloadAudioFile(fileUrl)` — reverses the path and downloads as a `Buffer`.

**`services/processLiveMeeting.js`**
- Downloads the live recording, runs `transcribeAudio` → `generateNotes` → `extractTasks`, persists tasks + notes + transcript on `meetings`, marks `processed=true`. On error, stores the error message in `notes`.

**`services/email.js`**
- Nodemailer-based invitation email (used by `POST /api/organizations/invite`).

### 6.4 WebRTC signaling: `sockets/signalingHandler.js`
- Tracks `roomId -> Set<socketId>` in memory.
- Events: `join-room`, `offer`, `answer`, `ice-candidate`, `mute`, `unmute`, `speaking`, `leave-room`, `disconnect`.
- Emits to peers: `user-joined`, `room-participants`, `user-muted`, `user-unmuted`, `user-speaking`, `user-left`.

---

## 7. Frontend Reference

### 7.1 Routing (`App.jsx`)
A short owl-themed splash screen plays for 1.6 seconds, then:

| Path | Component | Auth |
| :--- | :--- | :--- |
| `/` | `LandingPage` | Public |
| `/signup` | `SignUp` | Public |
| `/signin` | `SignIn` | Public |
| `/dashboard` | `Dashboard` | Protected |
| `/create-meeting` | `CreateMeeting` | Protected |
| `/create-group-meeting` | `CreateGroupMeeting` | Protected |
| `/create-live-meeting` | `CreateLiveMeeting` | Protected |
| `/live-meeting/:id` | `LiveMeeting` | Protected |
| `/meetings/:id` | `MeetingDetail` | Protected |
| `*` | redirect to `/` | — |

`ProtectedRoute` checks Supabase session before rendering.

### 7.2 State management
- **`OrganizationContext`** — single source of truth for the user's organizations, the active organization, role, and helpers (`refreshOrganizations`, `setActiveOrganization`, `leaveOrganization`).
- The active org id is persisted in `user_metadata.active_organization_id` via `POST /api/organizations/switch`.

### 7.3 Hooks
- **`useAuth`** — wraps Supabase auth state.
- **`useMediaQuery` / `useIsMdUp`** — responsive helpers.
- **`useAudioRecorder`** — `RecordRTC`-based recorder used for live meetings.
- **`useWebRTC(roomId, userId, userName)`** — central WebRTC orchestrator. Returns `peers`, `localStream`, `isMuted`, `toggleMute`, `speakingUsers`, `isConnected`, `error`, `leaveMeeting`, `toggleScreenShare`, `isScreenSharing`.

### 7.4 API client (`services/api.js`)
- Auto-detects backend URL based on hostname (custom domain / Vercel preview → Render backend, otherwise `localhost:5000`).
- Honors `VITE_API_URL` and `VITE_SOCKET_URL` overrides.
- Injects the Supabase access token on every request via an axios interceptor.
- Exposes typed helpers: `authAPI`, `usersAPI`, `meetingsAPI`, `organizationsAPI`, `chatAPI`, `communityChatAPI`, `liveMeetingsAPI`.

### 7.5 Notable components
- **`Chatbot`** — talks to `/api/meetings/:id/chat`; renders markdown.
- **`OrganizationPanel` / `OrganizationSwitcher` / `OrganizationSetupModal`** — full org lifecycle UI.
- **`OwlSplash`** — branded splash screen (still owl-themed; can be rebranded).
- **UI primitives** in `components/ui/` (glow effects, animated globe, scroll image section) provide the dark glassmorphism look.

---

## 8. Database Schema

The schema is provisioned via `supabase_schema.sql` (see the root README) inside Supabase. Key tables observed in the code:

| Table | Purpose | Notable columns |
| :--- | :--- | :--- |
| `organizations` | Tenant entity | `id`, `name`, `slug` (unique), `domain`, `invite_code`, `created_by`, `created_at` |
| `organization_members` | User ↔ org membership | `organization_id`, `user_id`, `role` (`admin` \| `member`), `joined_at` |
| `meetings` | Base meeting record | `id`, `title`, `description`, `created_by`, `organization_id` (nullable), `type` (`standard` \| `group`), `audio_file_url` (group only), `transcript`, `notes`, `processed`, `created_at` |
| `meeting_participants` | Participants of a meeting | `id`, `meeting_id`, `user_id`, `audio_file_url` (per-participant for standard) |
| `live_meetings` | Live-room metadata | `id`, `meeting_id`, `room_id` (nanoid), `status` (`scheduled` \| `live` \| `ended`), `started_at`, `ended_at`, `recording_url` |
| `live_participants` | Live-room presence | `live_meeting_id`, `user_id`, `is_bot`, `is_connected`, `joined_at`, `left_at` (composite unique on `live_meeting_id, user_id`) |
| `meeting_recordings` | Stored recordings | `live_meeting_id`, `file_url`, `file_size` |
| `tasks` | Extracted action items | `id`, `meeting_id`, `title`, `assignee_id` (nullable) |
| `chat_messages` | AI chat with the meeting bot | `id`, `meeting_id`, `user_id`, `message`, `response`, `created_at` |
| `chat_history` | (legacy/secondary chat store, deleted on meeting delete) | `meeting_id`, ... |
| `community_messages` | Human-to-human chat per meeting | `id`, `meeting_id`, `user_id`, `message`, `created_at` |
| `community_chat` | (legacy table cleaned up on meeting delete) | `meeting_id`, ... |

A public **storage bucket** named `meeting-audio` holds raw audio. Files are organized as `{meetingId}/{participantId}_{timestamp}_{originalName}`.

> The schema relies on **Row Level Security (RLS)** policies in PostgreSQL to keep data isolated per organization / participant.

---

## 9. REST API Reference

Base URL: `/api`. All routes (except `/api/auth/*`) require `Authorization: Bearer <Supabase JWT>`.

### 9.1 Auth — `/api/auth`
| Method | Path | Body | Notes |
| :--- | :--- | :--- | :--- |
| POST | `/signup` | `{ email, password, fullName? }` | Creates Supabase user; returns `user`, `session`. |
| POST | `/signin` | `{ email, password }` | Returns `user`, `session`. |
| POST | `/signout` | — | Invalidates the token (best-effort). |
| GET | `/me` | — | Returns the current Supabase user. |

### 9.2 Users — `/api/users`
| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/` | Lists members of the current user's org (excludes self). |

### 9.3 Organizations — `/api/organizations`
| Method | Path | Body / Query | Description |
| :--- | :--- | :--- | :--- |
| POST | `/` | `{ name }` | Creates an org; current user becomes admin. Slug is auto-generated and unique. |
| POST | `/join` | `{ inviteCode }` | Joins by code. Domain must match org domain. |
| GET | `/me` | — | (Legacy single-org) returns the user's org. |
| GET | `/all` | — | Returns ALL orgs the user belongs to. |
| GET | `/members?organizationId=` | — | Lists members of an org the caller belongs to. |
| POST | `/switch` | `{ organizationId }` | Persists active org in `user_metadata`. |
| POST | `/leave` | `{ organizationId }` | Leaves an org; refuses if user is the sole admin while other members exist. |
| POST | `/regenerate-invite` | `{ organizationId }` | Admin-only; rotates invite code. |
| POST | `/invite` | `{ email, organizationId }` | Sends invitation email; rejects domains that don't match. |
| DELETE | `/members/:userId?organizationId=` | — | Admin-only; removes a member. |

### 9.4 Meetings — `/api/meetings`
| Method | Path | Body / Query | Description |
| :--- | :--- | :--- | :--- |
| POST | `/` | `{ title, description?, participantIds?, organizationId?, type? }` | Creates a meeting; verifies org membership if `organizationId` set. |
| GET | `/?organizationId=` | — | Returns meetings where the user is creator OR participant. |
| GET | `/:id` | — | Returns the meeting + participants (enriched with names/emails) + tasks. |
| POST | `/:id/upload` | `multipart/form-data: audioFiles[]`, body `participantIds` (JSON) | For `standard`: one file per participant. For `group`: exactly one file (`group_audio`). |
| POST | `/:id/process` | — | Returns 200 immediately and runs `processMetingAsync` (transcribe → notes → tasks). |
| GET | `/:id/status` | — | Returns `{ processed, hasTranscript, hasNotes }`. |
| DELETE | `/:id` | — | Creator-only; cascades deletes for tasks, community messages, chat history, and participants. |

### 9.5 Meeting Chatbot — `/api/meetings/:id/chat`
| Method | Path | Body | Description |
| :--- | :--- | :--- | :--- |
| POST | `/:id/chat` | `{ message }` | Generates a Groq response grounded in transcript/notes/tasks; persists to `chat_messages`. Requires `processed=true`. |
| GET | `/:id/chat/history` | — | Returns full chat history for the meeting. |

### 9.6 Community Chat — `/api/community-chat`
| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/:meetingId` | All human messages for a meeting (creator or participants only). |
| POST | `/:meetingId` | Body `{ message }`. Inserts a message; returns it enriched with user info. |

### 9.7 Live Meetings — `/api/live-meetings`
| Method | Path | Body / Files | Description |
| :--- | :--- | :--- | :--- |
| POST | `/create` | `{ title, description?, participantIds? }` | Creates a base meeting + a `live_meetings` row with a 12-char nanoid `room_id`. Returns `joinUrl`. |
| GET | `/:id` | — | Live meeting + base meeting + participants. |
| POST | `/:id/start` | — | Creator-only. Sets `status=live`, `started_at`. Adds an AI bot participant (best-effort). |
| POST | `/:id/end` | — | Creator-only. Sets `status=ended`, `ended_at`, marks all live participants disconnected. Triggers `processLiveMeetingAsync` if a recording is already uploaded. |
| POST | `/:id/upload-recording` | `multipart/form-data: recording` | Stores the recording, persists `recording_url`, kicks off processing if meeting already ended. |
| POST | `/:id/join` | — | Upserts a `live_participants` row, sets `is_connected=true`. |
| POST | `/:id/leave` | — | Sets `is_connected=false`, `left_at=now`. |

### 9.8 Health / Diagnostics
| Method | Path | Description |
| :--- | :--- | :--- |
| GET | `/api/health` | Liveness check. |
| GET | `/api/cors-check` | Returns the request origin and whether the CORS allowlist matched. |

---

## 10. WebSocket / Socket.io Events

Connection URL is auto-detected (`VITE_SOCKET_URL` override available). All events flow through `sockets/signalingHandler.js`.

### Client → Server
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `join-room` | `{ roomId, userId, userName }` | Subscribes the socket to the room and registers identity. |
| `offer` | `{ offer, to }` | Forwards a WebRTC SDP offer to a specific peer's socketId. |
| `answer` | `{ answer, to }` | Forwards a WebRTC SDP answer. |
| `ice-candidate` | `{ candidate, to }` | Forwards an ICE candidate. |
| `mute` | — | Notifies others. |
| `unmute` | — | Notifies others. |
| `speaking` | `{ isSpeaking }` | Notifies others when VAD detects voice. |
| `leave-room` | — | Cleans up before disconnect. |

### Server → Client
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `user-joined` | `{ userId, userName, socketId }` | A peer joined; existing peers should send offers. |
| `room-participants` | `[{ userId, userName, socketId }]` | Sent to the new peer with the existing roster. |
| `offer` | `{ offer, from, userId, userName }` | A peer sent an offer. |
| `answer` | `{ answer, from }` | A peer sent an answer. |
| `ice-candidate` | `{ candidate, from }` | A peer sent an ICE candidate. |
| `user-muted` / `user-unmuted` | `{ userId, socketId }` | UI updates. |
| `user-speaking` | `{ userId, socketId, isSpeaking }` | UI updates. |
| `user-left` | `{ userId, socketId }` | Tear down the peer connection. |

---

## 11. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>     # NOT the anon key
GROQ_API_KEY=<groq_api_key>
FRONTEND_URL=http://localhost:5173          # used for invite/join URLs and CORS
AI_BOT_EMAIL=ai-bot@meetai.internal         # optional; used to mark a bot user as a live participant
# Optional SMTP (for invitation emails)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_API_URL=http://localhost:5000/api      # optional; auto-detected otherwise
VITE_SOCKET_URL=http://localhost:5000       # optional; auto-detected otherwise
```

---

## 12. Local Development Setup

### Prerequisites
- Node.js 16+ (Node 18+ recommended for Express 5)
- A Supabase project with:
  - `meeting-audio` public storage bucket
  - The SQL schema from `supabase_schema.sql` applied (creates tables + RLS policies)
- A Groq API key

### Install & run
```bash
# 1. Backend
cd backend
npm install
npm run dev          # http://localhost:5000

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Useful endpoints during dev
- `GET http://localhost:5000/api/health`
- `GET http://localhost:5000/api/cors-check` (sends back the origin and whether it matched the allowlist)

---

## 13. Deployment

| Layer | Platform | Notes |
| :--- | :--- | :--- |
| Frontend | **Vercel** | `npm run vercel-build`. Set `VITE_*` env vars. |
| Backend | **Render** | Persistent connection required for Socket.io. Live URL: `https://meeting-ai-3kyx.onrender.com`. |
| DB / Auth / Storage | **Supabase** | One project; service-role key on backend, anon key on frontend. |

> **Important:** Vercel serverless functions do **not** keep WebSocket connections alive. The Socket.io backend must run on Render (or any host that supports persistent connections). The CORS allowlist already includes `meetingai.dev`, `www.meetingai.dev`, the Vercel preview pattern, and the Render URL.

The custom domain `meetingai.dev` is whitelisted both in the Express CORS layer and in the frontend's auto-detection logic for the API/Socket URLs.

---

## 14. Security & Access Control

- **Auth** — every protected route runs `authMiddleware`, which calls `supabase.auth.getUser(token)` per request. The frontend attaches the access token via an axios interceptor.
- **RLS** — PostgreSQL Row Level Security (configured in `supabase_schema.sql`) is the primary data isolation mechanism. The backend uses the **service role** key, so server-side endpoints additionally enforce ownership/membership checks (`created_by === userId`, membership lookups, participant lookups).
- **Org membership checks** are repeated in: meeting creation, member listing, invite regeneration, member removal, leaving, switching.
- **Domain enforcement** — `POST /organizations/join` and `POST /organizations/invite` both reject mismatched email domains.
- **Storage** — files uploaded to `meeting-audio` are served via Supabase public URLs; downloads on the backend extract the path after `/meeting-audio/` and re-fetch via the SDK.
- **CORS** — explicit allowlist + tolerant matcher (`isOriginAllowed`) so `www`/non-`www`, subdomains, and Vercel previews all pass without weakening to `*`.

---

## 15. Future Roadmap

These are natural next steps based on the current code:

- **Speaker diarization** for group meetings (currently inferred via prompt) using a dedicated diarization model.
- **Streaming transcripts** during live meetings instead of post-meeting batch transcription.
- **Calendar / scheduling integration** (Google Calendar, Outlook).
- **TURN server** to make WebRTC reliable behind strict NATs (mesh-only currently).
- **Per-task status & due dates** UI (schema already supports a `tasks` row; status fields can be added).
- **Search across past meetings** with vector embeddings of transcripts.
- **Mobile experience polish** — `MobileDrawer` exists but more screens can be tuned.
- **Schema migration tooling** — replace manual `supabase_schema.sql` with a migration tool (Drizzle, Prisma, or Supabase migrations).

---

## License

This project is released under the **MIT License**.
