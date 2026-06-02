# Meeting AI: Comprehensive Technical Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture & System Design](#3-architecture--system-design)
4. [Project Structure](#4-project-structure)
5. [Features (Detailed)](#5-features-detailed)
6. [API Reference](#6-api-reference)
7. [Database / Data Models](#7-database--data-models)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [State Management & Data Flow](#9-state-management--data-flow)
10. [Environment Variables & Configuration](#10-environment-variables--configuration)
11. [Installation & Local Setup](#11-installation--local-setup)
12. [Deployment](#12-deployment)
13. [Known Issues / Limitations](#13-known-issues--limitations)
14. [Future Improvements](#14-future-improvements)

---

## 1. Project Overview

### What This Project Does

Meeting AI is a full-stack, production-grade web application that automates the end-to-end meeting workflow. It enables teams to:

- **Conduct live meetings** using WebRTC peer-to-peer audio/video conferencing
- **Record meetings** with high-fidelity audio capture
- **Transcribe audio** using Groq's Whisper API with automatic language translation to English
- **Generate intelligent meeting notes** with structured summaries, key points, decisions, and action items
- **Extract and assign tasks** automatically from meeting transcripts to the correct participants
- **Query meetings contextually** using an integrated AI chatbot that understands the full meeting context
- **Share meetings securely** with team members via organization-based access control

### Core Problem It Solves

Traditional meeting workflows suffer from:

1. **Manual documentation overhead** - Post-meeting, someone must manually transcribe and summarize discussions
2. **Task accountability gaps** - Action items are often lost or misassigned
3. **Inefficient knowledge retrieval** - Finding information from past discussions is time-consuming
4. **Scalability issues** - Large teams cannot efficiently manage and organize meeting artifacts
5. **Information silos** - Meetings lack secure, centralized storage and sharing mechanisms

Meeting AI eliminates these problems by automating transcription, summarization, task extraction, and providing AI-powered contextual search across all meeting data.

### Target Users & Use Cases

**Primary Users:**
- Remote/hybrid teams needing efficient meeting documentation
- Executive teams requiring high-quality meeting notes and action tracking
- Consulting firms managing multiple client meetings
- Sales teams tracking client conversations
- Product teams coordinating complex feature discussions
- Support teams documenting customer interactions

**Key Use Cases:**
1. **Recorded meeting processing** - Upload pre-recorded audio files for automatic transcription and summarization
2. **Live collaborative meetings** - Conduct real-time peer-to-peer meetings with automatic recording and processing
3. **Organization-scoped collaboration** - Multi-user teams with domain-based organization membership
4. **Google Meet integration** - Chrome extension to record and process Google Meet calls directly
5. **Contextual knowledge base** - Build a searchable repository of meeting insights

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | Core UI framework for building interactive components |
| **Vite** | 7.2.4 | Lightning-fast build tool and development server |
| **React Router** | 7.11.0 | Client-side routing for SPA navigation |
| **Tailwind CSS** | 3.4.19 | Utility-first CSS for responsive, modern UI styling |
| **Axios** | 1.13.2 | HTTP client for API communication with automatic auth handling |
| **Socket.io Client** | 4.8.3 | Real-time bidirectional communication for WebRTC signaling |
| **Framer Motion** | 12.35.0 | Declarative animations and transitions |
| **React Markdown** | 10.1.0 | Render markdown meeting notes in the UI |
| **RecordRTC** | 5.6.2 | Browser-based audio/video recording |
| **Three.js** | 0.183.2 | 3D graphics for UI enhancements (hero animations) |
| **@react-three/fiber** | 9.5.0 | React renderer for Three.js |
| **@shiguredo/rnnoise-wasm** | 2025.1.5 | WebAssembly-based noise suppression for audio |
| **Supabase JS** | 2.89.0 | Client SDK for Supabase Auth and real-time features |
| **Lucide React** | 0.562.0 | Lightweight icon library |

**Why These Choices:**
- **React + Vite**: Provides fast hot module replacement during development and optimized production builds for sub-second page loads
- **Tailwind CSS**: Enables rapid UI iteration with a consistent design system; reduces CSS overhead through tree-shaking
- **Socket.io**: Reliable WebSocket fallback for real-time peer discovery and ICE candidate exchange in WebRTC
- **Groq Integration**: Leverages specialized LPU™ hardware for 10-100x faster LLM inference compared to GPU-based alternatives
- **Supabase**: Provides integrated authentication, database, and storage without managing separate infrastructure

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 16+ | JavaScript runtime for server-side logic |
| **Express** | 5.2.1 | Lightweight, unopinionated web framework |
| **Socket.io** | 4.8.3 | Real-time WebRTC signaling and event broadcasting |
| **Multer** | 2.0.2 | Middleware for handling file uploads (audio files) |
| **Groq SDK** | 0.37.0 | Official SDK for Groq API (transcription, summarization, LLM inference) |
| **Supabase JS** | 2.89.0 | Admin SDK for database operations and storage management |
| **Nodemailer** | 7.0.13 | Email service for sending invitations and notifications |
| **CORS** | 2.8.5 | Enable cross-origin requests from frontend and extension |
| **dotenv** | 17.2.3 | Environment variable management |
| **Nanoid** | 5.1.6 | Generate cryptographically secure, URL-friendly unique IDs |
| **Form-data** | 4.0.5 | Construct multipart form data for Groq API uploads |

**Why These Choices:**
- **Express**: Minimal overhead allows for high-performance request handling; large ecosystem of middleware
- **Groq SDK**: Direct, low-latency access to Whisper and LLaMA models; critical for the "AI speed" competitive advantage
- **Supabase**: Removes database administration burden; built-in Row Level Security enforces data privacy at the database layer
- **Nodemailer**: Flexible email integration with support for SMTP and Gmail app passwords

### Extension (Chrome/Chromium)

| Technology | Purpose |
|-----------|---------|
| **Manifest V3** | Latest Chrome extension specification with improved security and performance |
| **Service Worker** | Background process for orchestrating tab capture and offscreen recording |
| **Offscreen Document** | Isolated execution context for recording without blocking the extension UI |
| **Content Script** | Injects "Record with Meeting AI" button into Google Meet |
| **Chrome Storage API** | Persist user settings (API URL, auth token) |
| **Chrome Tab Capture API** | Capture Google Meet tab audio/video stream |

**Why These Choices:**
- **Manifest V3**: Required by modern Chromium browsers; improves security by restricting background script capabilities
- **Offscreen Document + Service Worker**: Enables non-blocking tab capture; getMediaStreamId runs in the service worker, recording runs offscreen
- **Content Script**: Allows seamless injection of the record button into Google Meet's UI without user intervention

### Infrastructure & DevOps

| Service | Purpose |
|---------|---------|
| **Supabase** | Managed PostgreSQL database, real-time subscriptions, authentication, file storage |
| **Groq Cloud** | LLM inference for transcription (Whisper), summarization, and task extraction (LLaMA 3.3) |
| **Vercel** | Frontend deployment with edge functions and automatic CI/CD |
| **Render** | Backend deployment with native WebSocket support for Socket.io |
| **PostgreSQL (Supabase)** | Relational database with Row Level Security for multi-tenant data isolation |

---

## 3. Architecture & System Design

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Landing Page   │  │   Dashboard      │  │  Meeting Detail  │   │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Create Meeting  │  │  Live Meeting    │  │  Chatbot Widget  │   │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                       │
│  Supabase JS Auth | Axios API Client | Socket.io WebRTC Signaling   │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │ HTTPS + WebSocket
                   │
┌──────────────────▼──────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                        │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ Auth Routes       │  │  Meeting Routes   │  │ Chat Routes    │  │
│  │ /auth/signup      │  │ /meetings         │  │ /chat          │  │
│  │ /auth/signin      │  │ /meetings/:id     │  │ /community-    │  │
│  └───────────────────┘  └───────────────────┘  │  chat          │  │
│                                                 └────────────────┘  │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ Org Routes        │  │ Live Meeting      │  │ Users Routes   │  │
│  │ /organizations    │  │ /live-meetings    │  │ /users         │  │
│  │ /org/:id/members  │  │ /process          │  └────────────────┘  │
│  └───────────────────┘  └───────────────────┘                       │
│                                                                       │
│  Socket.io Signaling Handler | Auth Middleware | Groq Services      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
         ┌─────────┼─────────┬──────────────┐
         │         │         │              │
    HTTPS│    WebSocket  File Upload    gRPC/HTTP
         │         │         │              │
┌────────▼─┐   ┌──▼──┐  ┌───▼──────┐  ┌────▼──────┐
│ Supabase │   │I/O  │  │ Storage  │  │ Groq API  │
│  Auth +  │   │Bind │  │Bucket    │  │  Cloud    │
│ Database │   │    │  │(S3-like) │  │  (LLMs)   │
└──────────┘   └─────┘  └──────────┘  └───────────┘
```

### Data Flow: From User Input to Output

#### Scenario 1: Recorded Meeting Processing

```
User Upload (MP3)
       ↓
[Frontend] Create Meeting Form
       ↓
POST /api/meetings (Create meeting record)
       ↓
[Database] Meetings table created
       ↓
POST /api/meetings/:id/upload (File upload with metadata)
       ↓
[Backend] Multer validates file type & size
       ↓
[Storage] Upload to Supabase Storage bucket
       ↓
POST /api/meetings/:id/process (Trigger processing)
       ↓
[Backend] Queue async processing job
       ↓
Download audio file → Groq Whisper API → English transcript
       ↓
Transcript → Groq LLaMA 3.3 → Professional meeting notes
       ↓
Transcript + Participants → Groq LLaMA 3.3 → Extracted tasks
       ↓
Update [Database] Meetings record with transcript, notes, processed=true
Insert [Database] Tasks for each extracted action item
       ↓
[Frontend] Polls status until processed=true
       ↓
[Frontend] Displays transcript, notes, tasks, chatbot ready
```

#### Scenario 2: Live Meeting with Recording

```
User clicks "Start Live Meeting"
       ↓
POST /api/live-meetings/create (Create meeting + generate roomId)
       ↓
[Database] Meetings table + live_meetings table created
       ↓
[Frontend] Navigates to /live-meeting/:id
       ↓
Socket.io connection established
       ↓
[WebRTC] Local media stream obtained (mic + optional screen share)
       ↓
Socket.io signals: join-room → others notified
       ↓
[WebRTC] Exchange SDP offers/answers via Socket.io
       ↓
[WebRTC] Exchange ICE candidates for NAT traversal
       ↓
P2P audio/video streams connected
       ↓
[Host Only] Audio mixer combines: local mic + all remote streams
       ↓
[RecordRTC] Records mixed audio to Blob (in-memory)
       ↓
User ends meeting
       ↓
POST /api/live-meetings/:id/finalize-recording (Upload blob)
       ↓
[Storage] Save recording to Supabase Storage
       ↓
Update [Database] live_meetings.recording_url
       ↓
Backend async job: processLiveMeetingAsync()
       ↓
(Same as Scenario 1 from transcript onwards)
```

#### Scenario 3: Contextual Chatbot Query

```
User types question in Meeting Detail page
       ↓
POST /api/meetings/:id/chat (Send message)
       ↓
[Backend] Retrieve meeting transcript, notes, tasks from DB
       ↓
chatWithContext() builds prompt:
  - System context: "You are a meeting assistant"
  - User question: "What were the key decisions?"
  - Meeting transcript, notes, tasks as context
  - Previous chat history for conversational flow
       ↓
Prompt + context → Groq LLaMA 3.3 via chat completions API
       ↓
LLM generates contextual response
       ↓
Save chat exchange to [Database] chat_messages table
       ↓
Return response to [Frontend]
       ↓
[Frontend] Displays response with markdown formatting
```

### Architectural Patterns

1. **Microservices-Inspired Monorepo**
   - Three independently deployable services: Frontend, Backend, Extension
   - Each has its own dependencies and deployment configuration
   - Loose coupling via REST API and WebSocket events

2. **Real-Time Signaling via Socket.io**
   - Used exclusively for WebRTC peer discovery and offer/answer exchange
   - Fallback to polling/http if WebSocket unavailable
   - Room-based broadcast for multi-participant sessions

3. **Async Job Processing**
   - Meeting processing (transcription + AI generation) happens asynchronously
   - Frontend polls `/api/meetings/:id/status` to check processing progress
   - No blocking; user can navigate away while processing occurs

4. **Database-Driven Access Control**
   - Supabase Row Level Security (RLS) policies enforce data privacy
   - Users can only access meetings they created or are invited to
   - Organizations partition data at the application level

5. **Session Stateless**
   - Backend stores no session state (except Socket.io rooms for signaling)
   - All authentication via JWT tokens from Supabase
   - Any backend instance can handle any request

---

## 4. Project Structure

```
meeting-ai/
│
├── backend/
│   ├── src/
│   │   ├── server.js                    # Main Express app, HTTP/Socket.io server setup, CORS config
│   │   │
│   │   ├── config/
│   │   │   ├── groq.js                  # Groq SDK initialization with API key
│   │   │   └── supabase.js              # Supabase admin client (service role key)
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js                  # JWT verification middleware using Supabase
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                  # POST /auth/signup, /signin, /signout, /me
│   │   │   ├── meetings.js              # CRUD operations for meetings, file uploads, processing
│   │   │   ├── liveMeetings.js          # Live meeting creation, status, finalization
│   │   │   ├── organizations.js         # Org creation, member management, invites
│   │   │   ├── users.js                 # Get org members for participant selection
│   │   │   ├── chat.js                  # Chat with AI using meeting context
│   │   │   └── chat_community.js        # Community discussion messages for meetings
│   │   │
│   │   ├── services/
│   │   │   ├── groqService.js           # Whisper transcription, LLaMA summarization, task extraction
│   │   │   ├── storageService.js        # Supabase Storage upload/download with file sanitization
│   │   │   ├── email.js                 # Nodemailer SMTP setup, org invite emails
│   │   │   └── processLiveMeeting.js    # Async post-processing for live meeting recordings
│   │   │
│   │   ├── sockets/
│   │   │   └── signalingHandler.js      # WebRTC offer/answer/ICE-candidate routing via Socket.io
│   │   │
│   │   └── temp/                        # Temporary directory for uploaded files before processing
│   │
│   ├── package.json                     # Dependencies: express, groq-sdk, supabase, socket.io
│   ├── nodemon.json                     # Auto-restart on file changes during development
│   ├── vercel.json                      # Serverless deployment config (if used)
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Root component with routes and splash screen
│   │   ├── main.jsx                     # Vite entry point
│   │   ├── index.css                    # Global CSS with Tailwind base imports
│   │   ├── App.css                      # App-level overrides
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Marketing/intro page
│   │   │   ├── SignUp.jsx               # User registration via Supabase Auth
│   │   │   ├── SignIn.jsx               # User login via Supabase Auth
│   │   │   ├── Dashboard.jsx            # List meetings, create new, org switcher
│   │   │   ├── CreateMeeting.jsx        # Upload audio file + select participants
│   │   │   ├── CreateGroupMeeting.jsx   # Alternative UI for group meeting setup
│   │   │   ├── CreateLiveMeeting.jsx    # Initialize live meeting with title/description
│   │   │   ├── LiveMeeting.jsx          # WebRTC peer connections, audio/video UI, recording
│   │   │   ├── MeetingDetail.jsx        # View transcript, notes, tasks, chat, community
│   │   │   ├── NotFound.jsx             # 404 page
│   │   │   └── NotFound.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Chatbot.jsx              # Chat interface for meeting Q&A
│   │   │   ├── ProtectedRoute.jsx       # Route guard checking authentication
│   │   │   ├── MobileDrawer.jsx         # Mobile-responsive side drawer
│   │   │   ├── OrganizationSetupModal.jsx # First-time org creation modal
│   │   │   ├── OrganizationPanel.jsx    # Org details, member list, settings
│   │   │   ├── OrganizationSwitcher.jsx # Dropdown to switch active org
│   │   │   ├── OwlSplash.jsx            # Animated splash screen on app load
│   │   │   ├── Seo.jsx                  # SEO meta tags helper
│   │   │   │
│   │   │   └── ui/
│   │   │       ├── glowing-effect.tsx   # Glassmorphism glowing background
│   │   │       ├── globe-hero.tsx       # 3D globe animation (Three.js)
│   │   │       ├── container-scroll-animation.tsx
│   │   │       ├── faq-monocrhome.tsx
│   │   │       ├── gradual-spacing.tsx
│   │   │       ├── glitchy-404-1.tsx    # 404 animation
│   │   │       └── demo.tsx
│   │   │
│   │   ├── contexts/
│   │   │   └── OrganizationContext.jsx  # Global org state, role, membership
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js             # WebRTC connection lifecycle, peer management
│   │   │   ├── useMeetingRecording.js   # Audio mixing for live meeting recording
│   │   │   ├── useAudioRecorder.js      # RecordRTC wrapper for blob capture
│   │   │   ├── useAuth.js               # Supabase auth state (not in use; using service layer instead)
│   │   │   ├── useMediaQuery.js         # Responsive breakpoint detection (md, lg)
│   │   │   └── useRefetchOnFocus.js     # Refetch data when tab regains focus
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance with interceptors; all API endpoints
│   │   │   └── supabase.js              # Supabase client for auth (JS auth, not admin)
│   │   │
│   │   ├── lib/
│   │   │   ├── structuredData.js        # JSON-LD for SEO
│   │   │   └── utils.ts                 # Utility functions (truncate, format dates, etc.)
│   │   │
│   │   ├── utils/
│   │   │   ├── audioEnhancement.js      # RNNoise noise suppression for WebRTC
│   │   │   └── meetingAudioMixer.js     # Web Audio API mixer for combining streams
│   │   │
│   │   ├── assets/                      # Images, icons, branding
│   │   │
│   │   └── config/
│   │       └── seo.js                   # SEO metadata (title, description, keywords)
│   │
│   ├── public/
│   │   ├── robots.txt                   # SEO robots directives
│   │   ├── site.webmanifest             # PWA manifest
│   │   └── sitemap.xml                  # XML sitemap for search engines
│   │
│   ├── package.json                     # Dependencies: react, vite, socket.io-client, axios
│   ├── vite.config.js                   # Vite build config with React plugin
│   ├── tailwind.config.cjs              # Tailwind CSS customization
│   ├── postcss.config.cjs               # PostCSS with autoprefixer and Tailwind
│   ├── jsconfig.json                    # JS path aliases and module settings
│   ├── eslint.config.js                 # ESLint rules
│   ├── vercel.json                      # Vercel deployment config
│   └── README.md
│
├── extension/
│   ├── manifest.json                    # MV3 manifest with permissions and host_permissions
│   ├── background.js                    # Service worker: orchestrates tab capture and upload
│   ├── offscreen.html                   # Offscreen document HTML (USER_MEDIA context)
│   ├── offscreen.js                     # Offscreen worker: RecordRTC recording and blob capture
│   │
│   ├── lib/
│   │   ├── api.js                       # API client for backend (sign in, create meeting, upload)
│   │   └── config.js                    # DEFAULT_API_BASE, DEFAULT_APP_URL constants
│   │
│   ├── popup/
│   │   ├── popup.html                   # Popup UI (signin form, settings)
│   │   ├── popup.js                     # Popup logic (signin, signout, settings persistence)
│   │   └── popup.css                    # Popup styling
│   │
│   ├── content/
│   │   ├── meet.js                      # Content script: injects record button into Google Meet
│   │   └── meet.css                     # Styling for injected record button
│   │
│   ├── icons/
│   │   ├── icon16.png                   # 16x16 extension icon
│   │   ├── icon48.png                   # 48x48 extension icon
│   │   └── icon128.png                  # 128x128 extension icon
│   │
│   ├── migrations/
│   │   └── add_source_column.sql        # Database migration (if any)
│   │
│   └── README.md
│
├── README.md                            # Project overview and getting started
└── DOCUMENTATION.md                     # This file
```

---

## 5. Features (Detailed)

### 5.1 User Authentication & Authorization

**What It Does:**
- Users register with email and password
- Supabase Auth manages JWT tokens
- Protected routes require valid tokens
- Multi-organization support with role-based access

**How It Works Internally:**
```
Frontend: SignUp page → POST /api/auth/signup
Backend: supabase.auth.signUp() creates Supabase Auth user + metadata
Supabase: Generates JWT session token
Frontend: Stores token in Supabase session storage
Subsequent requests: Axios interceptor adds "Authorization: Bearer {token}"
Backend: Auth middleware verifies token with supabase.auth.getUser()
```

**Files Involved:**
- Backend: [src/routes/auth.js](backend/src/routes/auth.js), [src/middleware/auth.js](backend/src/middleware/auth.js)
- Frontend: [pages/SignUp.jsx](frontend/src/pages/SignUp.jsx), [pages/SignIn.jsx](frontend/src/pages/SignIn.jsx)
- Services: [frontend/src/services/supabase.js](frontend/src/services/supabase.js)

**User Experience:**
1. Navigate to /signup
2. Enter email, password, full name
3. Create account → auto sign-in
4. Redirected to /dashboard
5. Prompted to create first organization

---

### 5.2 Organization Management

**What It Does:**
- Users can create multiple organizations
- Organizations are domain-based (auto-extracted from user email)
- Invite other users by email to join an organization
- Members can be invited via unique invite code
- Organization-scoped data isolation (meetings are tied to orgs)

**How It Works Internally:**
```
User creates org: POST /api/organizations
Backend generates:
  - URL-friendly slug (e.g., "acme-corp", "acme-corp-1")
  - Unique invite code (6 alphanumeric chars)
  - Domain extracted from user email (@acme.com)
Supabase:
  - Insert organizations table row
  - Insert organization_members row (creator as owner)
User invites colleague:
  - POST /api/organizations/:id/invite
  - Backend sends email with invite link or code
  - Invitee clicks link → auto-joins org
```

**Files Involved:**
- Backend: [src/routes/organizations.js](backend/src/routes/organizations.js), [src/services/email.js](backend/src/services/email.js)
- Frontend: [components/OrganizationSetupModal.jsx](frontend/src/components/OrganizationSetupModal.jsx), [components/OrganizationPanel.jsx](frontend/src/components/OrganizationPanel.jsx)
- Context: [contexts/OrganizationContext.jsx](frontend/src/contexts/OrganizationContext.jsx)

**User Experience:**
1. First login → "Create Organization" modal
2. Enter org name (auto-generates slug)
3. Org created; user is owner
4. In dashboard → Org panel → "Invite member"
5. Enter colleague email → Nodemailer sends invite
6. Colleague receives email with invite link
7. Clicks link → joins org → can see all org meetings

---

### 5.3 Recorded Meeting Processing

**What It Does:**
- Users upload pre-recorded audio files (MP3, WAV, M4A, OGG, WebM)
- Select participants who were in the meeting
- Backend processes asynchronously:
  - Transcribes audio to English using Groq Whisper API
  - Generates professional meeting notes
  - Extracts and assigns tasks to participants
- User views results on Meeting Detail page

**How It Works Internally:**
```
CreateMeeting form:
  1. User enters meeting title, description
  2. Selects participants (max 10)
  3. Uploads one audio file per participant
  
Backend processing:
  1. POST /api/meetings/:id/upload-audio
  2. Multer validates: fileSize < 25MB, type in whitelist
  3. Upload to Supabase Storage: meetings/{meetingId}/{participantId}_{timestamp}_{filename}
  4. Trigger: POST /api/meetings/:id/process
  
Groq Transcription:
  1. Download audio file from storage → Buffer
  2. groq.audio.translations.create()
     - model: "whisper-large-v3"
     - Automatically handles Urdu, English mix, and any language
     - Returns JSON with text field
  3. correctSentences() uses LLaMA to fix grammar/clarity
     - Preserves original meaning and content
     - Returns polished transcript
  
Note Generation:
  1. Prompt: """Generate meeting notes with sections:
        1. Summary
        2. Key Discussion Points
        3. Decisions Made
        4. Action Items
        5. Next Steps
     """
  2. groq.chat.completions.create(llama-3.3-70b-versatile)
  3. Returns formatted notes
  
Task Extraction:
  1. Prompt: """Extract action items. Return JSON array:
        [{"title": "...", "assigneeId": "..."}]
     """
  2. Parse JSON response
  3. Insert tasks into tasks table
  
Final:
  1. Update meetings table: transcript, notes, processed=true
  2. Frontend polls /api/meetings/:id/status
  3. Once processed=true, load full meeting data
  4. Display transcript, notes, tasks, enable chatbot
```

**Files Involved:**
- Backend: [src/routes/meetings.js](backend/src/routes/meetings.js), [src/services/groqService.js](backend/src/services/groqService.js), [src/services/storageService.js](backend/src/services/storageService.js)
- Frontend: [pages/CreateMeeting.jsx](frontend/src/pages/CreateMeeting.jsx), [pages/MeetingDetail.jsx](frontend/src/pages/MeetingDetail.jsx)

**User Experience:**
1. Click "Create Meeting" from dashboard
2. Enter meeting title, select participants
3. Upload audio for each participant
4. Click "Submit" → meeting created, processing starts
5. Redirected to dashboard (or meeting detail if auto-redirect)
6. See "Processing" status indicator
7. Refresh page or wait → transcript, notes, tasks appear
8. Open meeting detail → view all content

---

### 5.4 Live Meeting with Real-Time Conferencing

**What It Does:**
- Initiate a live meeting with peer-to-peer WebRTC audio/video
- Multiple participants connect in a room
- Host records the meeting (mixed audio of all participants)
- Audio is automatically processed after meeting ends
- Participants can see who's speaking and mute/unmute

**How It Works Internally:**
```
Create Live Meeting:
  1. POST /api/live-meetings/create
  2. Generate unique roomId (nanoid)
  3. Create meetings table row (type='live')
  4. Create live_meetings table row (status='scheduled')
  5. Return joinUrl: /live-meeting/{liveMeetingId}
  
Join Live Meeting (Frontend):
  1. Navigate to /live-meeting/{liveMeetingId}
  2. Fetch meeting details
  3. Establish Socket.io connection
  4. Get local media stream (requestUserMedia)
  5. Emit socket: join-room → { roomId, userId, userName }
  
Peer Discovery (Socket.io Signaling):
  1. New participant joins socket room
  2. Server sends back existing participants list
  3. New participant initiates WebRTC connection to each peer
  
WebRTC Connection Establishment:
  1. A → createPeerConnection() with RTCPeerConnection
  2. A → addTrack(localStream)
  3. A → createOffer()
  4. A → setLocalDescription(offer)
  5. A emits via socket: offer → B
  6. B receives: createAnswer()
  7. B → setLocalDescription(answer)
  8. B emits via socket: answer → A
  9. A → setRemoteDescription(answer)
  10. ICE candidates exchanged via socket
  11. P2P connection established!
  
Recording (Host Only):
  1. MeetingAudioMixer creates Web Audio API graph
  2. Add local stream + all peer streams to mixer
  3. RecordRTC records from mixer's output
  4. Meeting ends: recordedBlob captured
  5. POST /api/live-meetings/{id}/finalize-recording
  6. Upload blob to Supabase Storage
  7. Async processing job triggered (transcription, notes, tasks)
  
Meeting Ends:
  1. Host clicks "End Meeting"
  2. Update live_meetings.status = 'ended'
  3. Participants notified via socket
  4. Close WebRTC connections
  5. Recording finalized and uploaded
  6. Processing starts asynchronously
```

**Files Involved:**
- Backend: [src/routes/liveMeetings.js](backend/src/routes/liveMeetings.js), [src/sockets/signalingHandler.js](backend/src/sockets/signalingHandler.js), [src/services/processLiveMeeting.js](backend/src/services/processLiveMeeting.js)
- Frontend: [pages/LiveMeeting.jsx](frontend/src/pages/LiveMeeting.jsx), [pages/CreateLiveMeeting.jsx](frontend/src/pages/CreateLiveMeeting.jsx), [hooks/useWebRTC.js](frontend/src/hooks/useWebRTC.js), [hooks/useMeetingRecording.js](frontend/src/hooks/useMeetingRecording.js)
- Utils: [utils/meetingAudioMixer.js](frontend/src/utils/meetingAudioMixer.js), [utils/audioEnhancement.js](frontend/src/utils/audioEnhancement.js)

**User Experience:**
1. Click "Create Live Meeting"
2. Enter title, invite participants (optional)
3. Click "Start Meeting" → joined to live room
4. Wait for others to join (see list of participants)
5. Click "Allow" for microphone/camera access
6. See other participants' video and audio
7. Speaker indicators show who's speaking
8. Mute/unmute own audio
9. Share screen (if supported)
10. Host clicks "End Meeting"
11. Redirected to meeting detail
12. See "Processing" status
13. Minutes later: transcript, notes, tasks appear

---

### 5.5 Google Meet Chrome Extension

**What It Does:**
- Inject "Record with Meeting AI" button into Google Meet UI
- One-click recording of entire Google Meet call
- Automatically upload to Meeting AI platform
- Generate transcript and notes for the call

**How It Works Internally:**
```
User Clicks Record Button (in Google Meet):
  1. Content script (meet.js) detects button click
  2. Calls chrome.runtime.sendMessage({ action: 'START_RECORDING', tabId })
  3. Background service worker receives message
  
Background Service Worker (background.js):
  1. Check user is signed in: await getToken()
  2. Get Google Meet organization: getGoogleMeetOrg()
  3. chrome.tabCapture.getMediaStreamId({ targetTabId })
     - Returns stream ID (not a stream, just ID)
  4. setupOffscreenDocument()
     - Create offscreen.html with reason: 'USER_MEDIA'
  5. sendToOffscreen({ action: 'START_RECORDING', streamId })
  
Offscreen Document (offscreen.js):
  1. Receive streamId from background worker
  2. navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: streamId } } })
  3. RecordRTC recorder = new RecordRTC(stream, { type: 'audio', mimeType: 'audio/webm' })
  4. recorder.startRecording()
  5. Listen for messages from background worker
  
User Stops Recording:
  1. Content script sends: chrome.runtime.sendMessage({ action: 'STOP_RECORDING' })
  2. Background worker relays to offscreen: { action: 'STOP_RECORDING' }
  3. Offscreen: recorder.stopRecording(callback)
  4. Offscreen sends back audioBase64 (uint8array encoded)
  
Upload to Meeting AI:
  1. Background reconstructs Blob from base64
  2. POST /api/meetings (create new meeting with org context)
  3. POST /api/meetings/{id}/upload-extension-audio (upload blob)
  4. POST /api/meetings/{id}/process (trigger async processing)
  5. Get processing status
  6. Return meetingUrl to content script
  
Content Script UI:
  1. Shows "Recording..." status
  2. When upload complete, shows "Go to Meeting AI" link
  3. User clicks → opens meeting detail in new tab
```

**Files Involved:**
- Extension: [background.js](extension/background.js), [content/meet.js](extension/content/meet.js), [offscreen.js](extension/offscreen.js)
- Extension: [lib/api.js](extension/lib/api.js), [popup/popup.js](extension/popup/popup.js)

**User Experience:**
1. Install Meeting AI Chrome extension
2. Click extension icon → popup → Sign in
3. Join Google Meet call
4. Click "Record with Meeting AI" button
5. Recording indicator shows
6. When call ends, click "Stop Recording"
7. Toast appears: "Uploading..."
8. A few seconds later: "Go to Meeting AI" link
9. Click link → see meeting detail with transcript, notes, tasks

---

### 5.6 Intelligent Meeting Notes Generation

**What It Does:**
- Transform raw transcripts into structured, professional meeting notes
- Automatically identify: summary, key points, decisions, action items, next steps
- Uses Groq LLaMA 3.3 for context understanding

**How It Works Internally:**
```
Input: Raw transcript (potentially with grammar issues)
Output: Structured markdown notes

Prompt to LLaMA:
  "Generate comprehensive meeting notes with sections:
   1. Summary (2-3 sentences)
   2. Key Discussion Points (bullet list)
   3. Decisions Made (bullet list with who decided)
   4. Action Items (already extracted separately)
   5. Next Steps (what's next)"

Temperature: 0.3 (relatively deterministic)
Max tokens: 2000
Model: llama-3.3-70b-versatile

Response is parsed as markdown and stored in meetings.notes column
```

**Files Involved:**
- Backend: [src/services/groqService.js](backend/src/services/groqService.js) - `generateNotes()` function

**User Experience:**
1. Meeting processed
2. Click "Notes" tab on meeting detail
3. See beautifully formatted markdown with sections
4. Copy to clipboard
5. Export as PDF or Markdown

---

### 5.7 Automated Task Extraction & Assignment

**What It Does:**
- Analyze transcript to identify all action items
- Assign each task to the most appropriate participant
- Create task records in database
- Participants can view tasks assigned to them

**How It Works Internally:**
```
Input: Transcript + list of participants with IDs
Output: Task array [{title, assigneeId}, ...]

Prompt to LLaMA:
  "Extract all action items from transcript.
   For each task:
   1. Describe the task
   2. Identify assignee (participant ID or null if unclear)
   
   Participants:
   - John Smith (ID: uuid-1)
   - Jane Doe (ID: uuid-2)
   
   Return JSON array only:
   [{"title": "...", "assigneeId": "..."}]"

Temperature: 0.2 (deterministic)
Max tokens: 1500
Model: llama-3.3-70b-versatile

Response parsed as JSON
Insert into tasks table:
  - meeting_id: {meetingId}
  - title: {extracted title}
  - assignee_id: {extracted ID or null}
  - created_at: now()
  - completed: false
```

**Files Involved:**
- Backend: [src/services/groqService.js](backend/src/services/groqService.js) - `extractTasks()` and `extractGroupTasks()`

**User Experience:**
1. Meeting processed
2. Click "Tasks" tab on meeting detail
3. See list of all tasks with assignees
4. If assigned to you, mark as completed
5. Drag to reorder priority
6. Share tasks with team

---

### 5.8 Contextual AI Chatbot

**What It Does:**
- Ask questions about a specific meeting's content
- Chatbot returns answers grounded in the meeting transcript, notes, and tasks
- Maintains conversation history within a meeting
- Uses Groq LLaMA for context-aware responses

**How It Works Internally:**
```
User asks: "What were the key decisions?"

Backend receives: POST /api/meetings/{id}/chat { message: "..." }

Retrieval:
  1. Fetch meeting.transcript
  2. Fetch meeting.notes
  3. Fetch all tasks for this meeting
  4. Fetch chat history (previous exchanges)

Context Building:
  System prompt: "You are a meeting assistant. Answer questions based on the transcript, notes, and tasks provided."
  
  Context: 
    Transcript: [full transcript]
    Notes: [generated notes]
    Tasks: [list of extracted tasks]
    Previous chat: [list of previous exchanges]
    
  User message: "What were the key decisions?"

LLM Call:
  groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are a meeting assistant...' },
      { role: 'user', content: full_prompt }
    ],
    temperature: 0.7
  })

Response:
  "Based on the meeting transcript, the key decisions were: 1. [decision 1], 2. [decision 2], ..."

Save chat exchange:
  INSERT INTO chat_messages (meeting_id, user_id, message, response, created_at)

Return response to frontend
```

**Files Involved:**
- Backend: [src/routes/chat.js](backend/src/routes/chat.js), [src/services/groqService.js](backend/src/services/groqService.js) - `chatWithContext()`
- Frontend: [components/Chatbot.jsx](frontend/src/components/Chatbot.jsx), [pages/MeetingDetail.jsx](frontend/src/pages/MeetingDetail.jsx)

**User Experience:**
1. Open meeting detail
2. Click "Assistant" tab
3. See chat interface
4. Type question: "Summarize the key points"
5. See AI response with relevant quotes from transcript
6. Ask follow-up: "Who is responsible for the API integration?"
7. AI responds: "John Smith agreed to lead the API integration..."
8. Build knowledge progressively with conversational Q&A

---

### 5.9 Community Chat (Group Discussion)

**What It Does:**
- Participants can discuss meetings in a community chat
- Share thoughts, clarifications, questions
- Separate from the AI chatbot (human-to-human)
- Organized by meeting

**How It Works Internally:**
```
GET /api/community-chat/{meetingId}
  1. Verify user is creator or participant
  2. Fetch all messages for this meeting
  3. Enrich with user email/name from Auth
  4. Return message list

POST /api/community-chat/{meetingId} { message: "..." }
  1. Verify user is creator or participant
  2. Insert into community_messages table
  3. Return message

Tables:
  community_messages:
    - id (UUID)
    - meeting_id (FK)
    - user_id (FK)
    - message (text)
    - created_at (timestamp)
```

**Files Involved:**
- Backend: [src/routes/chat_community.js](backend/src/routes/chat_community.js)
- Frontend: [pages/MeetingDetail.jsx](frontend/src/pages/MeetingDetail.jsx) - "Community" tab

**User Experience:**
1. Open meeting detail
2. Click "Community" tab
3. See conversation thread
4. Type message: "I can take on the API integration task"
5. Click "Send" → message appears
6. Others see your message in real-time (polling)
7. Build group consensus on action items

---

### 5.10 Dashboard & Meeting Management

**What It Does:**
- View all meetings for the active organization
- See meeting status (processing, processed, archived)
- Quick view of key metrics: transcript, notes, tasks count
- Search and filter meetings
- Delete meetings (with confirmation)

**How It Works Internally:**
```
Dashboard component:
  1. Fetch active organization from context
  2. GET /api/meetings?organizationId={orgId}
  3. Receive: { meetings: [{id, title, created_by, created_at, processed, ...}] }
  4. Render cards with:
     - Meeting title
     - Created date
     - Participants
     - Processing status badge
     - Quick actions (view, delete, etc.)
  5. Poll every 30 seconds for status updates (silent refresh)
  6. When user returns to tab (focus), refresh immediately

Delete Meeting:
  1. DELETE /api/meetings/{id}
  2. Backend verifies user is owner or org member with permission
  3. Delete from meetings table (cascade to tasks, chat_messages, etc.)
  4. Delete from Supabase Storage (audio file)
  5. Return 204 No Content
```

**Files Involved:**
- Frontend: [pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

**User Experience:**
1. Sign in → dashboard loads
2. See list of all meetings (cards or table)
3. Each card shows title, date, status
4. Click card → view meeting detail
5. Click trash icon → confirm delete → meeting deleted
6. Use search bar → filter meetings by title
7. Use org switcher → switch to different organization
8. See meetings for that org

---

## 6. API Reference

### Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://meeting-ai-3kyx.onrender.com/api`

### Authentication

All endpoints (except `/auth/signup`, `/auth/signin`) require:
```
Authorization: Bearer {access_token}
```

Token obtained from `/auth/signin` response or from Supabase Auth client.

---

### Auth Endpoints

#### POST /auth/signup

Register a new user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
  }
}
```

**Errors:**
- `400`: Email already exists, weak password, etc.
- `500`: Server error

---

#### POST /auth/signin

Sign in and receive access token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Signed in successfully",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401`: Invalid email or password
- `500`: Server error

---

#### POST /auth/signout

Sign out (invalidate session).

**Request:** (no body)

**Response (200):**
```json
{
  "message": "Signed out successfully"
}
```

---

#### GET /auth/me

Get current user info (requires auth token).

**Request:** (no body)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  }
}
```

**Errors:**
- `401`: Invalid or expired token
- `500`: Server error

---

### Meetings Endpoints

#### POST /meetings

Create a new meeting.

**Request:**
```json
{
  "title": "Q4 Planning Meeting",
  "description": "Discuss Q4 roadmap and priorities",
  "participantIds": ["uuid1", "uuid2"],
  "organizationId": "org-uuid",
  "type": "standard",
  "source": "extension"
}
```

**Response (201):**
```json
{
  "meeting": {
    "id": "meeting-uuid",
    "title": "Q4 Planning Meeting",
    "created_by": "user-uuid",
    "organization_id": "org-uuid",
    "processed": false,
    "transcript": null,
    "notes": null,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400`: Missing title, invalid participants
- `403`: User not a member of organization
- `500`: Server error

---

#### GET /meetings

List all meetings for active organization.

**Request Query Params:**
- `organizationId` (optional): Filter by org; defaults to user's active org

**Response (200):**
```json
{
  "meetings": [
    {
      "id": "meeting-uuid",
      "title": "Q4 Planning",
      "created_by": "user-uuid",
      "created_at": "2025-01-15T10:30:00Z",
      "processed": true,
      "transcript": "...",
      "notes": "...",
      "meeting_participants": [
        { "user_id": "uuid1" },
        { "user_id": "uuid2" }
      ]
    }
  ]
}
```

---

#### GET /meetings/:id

Get meeting details (transcript, notes, tasks, status).

**Request:** (no body)

**Response (200):**
```json
{
  "meeting": {
    "id": "meeting-uuid",
    "title": "Q4 Planning",
    "description": "...",
    "created_by": "user-uuid",
    "transcript": "John: Let's discuss Q4... Jane: I propose...",
    "notes": "## Summary\n...",
    "processed": true,
    "created_at": "2025-01-15T10:30:00Z"
  },
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Finalize Q4 roadmap",
      "assignee_id": "uuid1",
      "completed": false,
      "created_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

**Errors:**
- `404`: Meeting not found
- `403`: Unauthorized (not owner or participant)
- `500`: Server error

---

#### GET /meetings/:id/status

Check processing status.

**Request:** (no body)

**Response (200):**
```json
{
  "id": "meeting-uuid",
  "processed": false,
  "progress": "Transcribing audio...",
  "error": null
}
```

Once `processed: true`, full meeting data is available via GET /meetings/:id.

---

#### POST /meetings/:id/upload-audio

Upload audio file for meeting processing.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file`: Audio file (MP3, WAV, M4A, OGG, WebM)
  - `participantId`: UUID of participant who spoke in this file

**Response (201):**
```json
{
  "message": "File uploaded successfully",
  "url": "https://supabase-storage.../meeting-audio/meeting-uuid/participant-uuid_1234567890_audio.mp3"
}
```

**Errors:**
- `400`: Invalid file type, file too large (>25MB)
- `404`: Meeting not found
- `413`: Payload too large
- `500`: Upload failed

---

#### POST /meetings/:id/upload-extension-audio

Upload audio from Chrome extension (100MB limit).

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file`: Audio/video file (WebM, MP3, WAV, M4A, OGG)

**Response (201):**
```json
{
  "message": "Recording uploaded successfully",
  "url": "https://supabase-storage.../meeting-audio/meeting-uuid/recording.webm"
}
```

---

#### POST /meetings/:id/process

Trigger asynchronous meeting processing (transcription, notes, tasks).

**Request:** (no body)

**Response (200):**
```json
{
  "message": "Processing started",
  "meetingId": "meeting-uuid"
}
```

Processing happens asynchronously. Frontend should poll `/meetings/:id/status` until `processed: true`.

---

#### DELETE /meetings/:id

Delete a meeting (and all associated data).

**Request:** (no body)

**Response (204):** No content

**Errors:**
- `403`: Not authorized to delete
- `404`: Meeting not found
- `500`: Deletion failed

---

### Chat Endpoints

#### POST /meetings/:id/chat

Send a message to the AI chatbot for this meeting.

**Request:**
```json
{
  "message": "What were the key decisions?"
}
```

**Response (200):**
```json
{
  "response": "Based on the transcript, the key decisions were: 1. Proceed with Q4 roadmap as proposed, 2. Allocate 3 engineers to API development..."
}
```

**Errors:**
- `400`: Meeting not processed yet, no transcript/notes
- `404`: Meeting not found
- `500`: AI response generation failed

---

#### GET /community-chat/:meetingId

Get all community messages for a meeting.

**Request:** (no body)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "user_id": "user-uuid",
      "user_email": "john@example.com",
      "user_name": "John Doe",
      "message": "I'll take on the API integration task",
      "created_at": "2025-01-15T14:00:00Z"
    }
  ]
}
```

---

#### POST /community-chat/:meetingId

Send a message to the community chat.

**Request:**
```json
{
  "message": "I'll handle the database schema design"
}
```

**Response (201):**
```json
{
  "message": {
    "id": "msg-uuid",
    "user_id": "user-uuid",
    "message": "I'll handle the database schema design",
    "created_at": "2025-01-15T14:00:00Z"
  }
}
```

---

### Live Meetings Endpoints

#### POST /live-meetings/create

Create a new live meeting (generates room ID).

**Request:**
```json
{
  "title": "Live Q&A Session",
  "description": "Real-time discussion",
  "participantIds": ["uuid1", "uuid2"],
  "organizationId": "org-uuid"
}
```

**Response (201):**
```json
{
  "meeting": {
    "id": "meeting-uuid",
    "title": "Live Q&A Session",
    "created_by": "user-uuid",
    "created_at": "2025-01-15T15:00:00Z"
  },
  "liveMeeting": {
    "id": "live-meeting-uuid",
    "meeting_id": "meeting-uuid",
    "room_id": "abc123defg45",
    "status": "scheduled",
    "created_at": "2025-01-15T15:00:00Z"
  },
  "joinUrl": "https://meetingai.dev/live-meeting/live-meeting-uuid",
  "roomId": "abc123defg45"
}
```

---

#### GET /live-meetings/:id

Get live meeting details and status.

**Request:** (no body)

**Response (200):**
```json
{
  "liveMeeting": {
    "id": "live-meeting-uuid",
    "meeting_id": "meeting-uuid",
    "room_id": "abc123defg45",
    "status": "live",
    "recording_url": null,
    "created_at": "2025-01-15T15:00:00Z"
  },
  "meeting": {
    "id": "meeting-uuid",
    "title": "Live Q&A Session",
    "created_by": "user-uuid",
    "meeting_participants": [
      { "user_id": "uuid1" },
      { "user_id": "uuid2" }
    ]
  }
}
```

---

#### PUT /live-meetings/:id

Update live meeting status (e.g., mark as "ended").

**Request:**
```json
{
  "status": "ended"
}
```

**Response (200):**
```json
{
  "liveMeeting": {
    "id": "live-meeting-uuid",
    "status": "ended",
    "updated_at": "2025-01-15T16:30:00Z"
  }
}
```

---

#### POST /live-meetings/:id/finalize-recording

Upload the final mixed recording after meeting ends.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file`: Recorded audio/webm file

**Response (201):**
```json
{
  "message": "Recording uploaded and processing started",
  "recording_url": "https://supabase-storage.../meeting-audio/meeting-uuid/recording.webm"
}
```

---

### Organizations Endpoints

#### POST /organizations

Create a new organization.

**Request:**
```json
{
  "name": "ACME Corporation"
}
```

**Response (201):**
```json
{
  "organization": {
    "id": "org-uuid",
    "name": "ACME Corporation",
    "slug": "acme-corporation",
    "domain": "acme.com",
    "invite_code": "ABC123",
    "created_by": "user-uuid",
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

#### GET /organizations

List all organizations the user is a member of.

**Request:** (no body)

**Response (200):**
```json
{
  "organizations": [
    {
      "id": "org-uuid",
      "name": "ACME Corporation",
      "slug": "acme-corporation",
      "domain": "acme.com",
      "created_by": "user-uuid",
      "created_at": "2025-01-15T10:00:00Z",
      "member_role": "owner"
    }
  ]
}
```

---

#### POST /organizations/:id/invite

Send invitation email to a user.

**Request:**
```json
{
  "email": "colleague@example.com",
  "inviteType": "email"
}
```

**Response (200):**
```json
{
  "message": "Invitation sent to colleague@example.com",
  "inviteCode": "ABC123"
}
```

**Errors:**
- `400`: Email service not configured
- `403`: User not authorized to send invites
- `500`: Email sending failed

---

#### POST /organizations/:id/leave

User leaves an organization.

**Request:** (no body)

**Response (200):**
```json
{
  "message": "You have left the organization"
}
```

---

### Users Endpoints

#### GET /users

List all users in the active organization (for participant selection).

**Request Query Params:**
- `organizationId` (optional): Org ID; defaults to active

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "fullName": "John Doe",
      "createdAt": "2025-01-01T10:00:00Z"
    },
    {
      "id": "user-uuid2",
      "email": "jane@example.com",
      "fullName": "Jane Smith",
      "createdAt": "2025-01-02T10:00:00Z"
    }
  ]
}
```

---

## 7. Database / Data Models

### Supabase Schema

#### Table: `auth.users` (Managed by Supabase Auth)

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  user_metadata JSONB, -- { "full_name": "John Doe" }
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

#### Table: `organizations`

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL, -- URL-friendly name
  domain VARCHAR, -- Extracted from user email (@acme.com)
  invite_code VARCHAR UNIQUE NOT NULL, -- 6-char code for invites
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Users can only read orgs they're members of
CREATE POLICY org_read_policy ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );
```

---

#### Table: `organization_members`

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member', -- 'owner', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- RLS Policy: Users can only read members of orgs they're in
CREATE POLICY org_members_read_policy ON organization_members
  FOR SELECT USING (
    organization_id IN (SELECT id FROM organizations WHERE created_by = auth.uid() OR id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
  );
```

---

#### Table: `meetings`

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  transcript TEXT, -- Full meeting transcript (null until processed)
  notes TEXT, -- Markdown meeting notes (null until processed)
  processed BOOLEAN DEFAULT FALSE, -- True once transcription/notes complete
  type VARCHAR DEFAULT 'standard', -- 'standard', 'live', 'group'
  source VARCHAR, -- 'extension', 'web', 'api', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Users can read meetings they created or are participants in
CREATE POLICY meetings_read_policy ON meetings
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
  );

-- RLS Policy: Users can only update their own meetings
CREATE POLICY meetings_update_policy ON meetings
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policy: Users can only delete their own meetings
CREATE POLICY meetings_delete_policy ON meetings
  FOR DELETE USING (created_by = auth.uid());
```

---

#### Table: `meeting_participants`

```sql
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- RLS Policy: Users can read participants for meetings they can access
CREATE POLICY meeting_participants_read_policy ON meeting_participants
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE created_by = auth.uid()
      OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
    )
  );
```

---

#### Table: `tasks`

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id),
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Users can read tasks for accessible meetings
CREATE POLICY tasks_read_policy ON tasks
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE created_by = auth.uid()
      OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
    )
  );

-- RLS Policy: Assignee or meeting owner can update task
CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE USING (
    assignee_id = auth.uid()
    OR meeting_id IN (SELECT id FROM meetings WHERE created_by = auth.uid())
  );
```

---

#### Table: `chat_messages`

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message VARCHAR NOT NULL, -- User's question
  response TEXT NOT NULL, -- AI response
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Users can read chat for accessible meetings
CREATE POLICY chat_messages_read_policy ON chat_messages
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE created_by = auth.uid()
      OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
    )
  );
```

---

#### Table: `community_messages`

```sql
CREATE TABLE community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Users can read community chat for accessible meetings
CREATE POLICY community_messages_read_policy ON community_messages
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE created_by = auth.uid()
      OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
    )
  );

-- RLS Policy: Users can insert messages to accessible meetings
CREATE POLICY community_messages_insert_policy ON community_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND meeting_id IN (
      SELECT id FROM meetings WHERE created_by = auth.uid()
      OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
    )
  );
```

---

#### Table: `live_meetings`

```sql
CREATE TABLE live_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  room_id VARCHAR UNIQUE NOT NULL, -- Unique room ID (nanoid)
  status VARCHAR DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended'
  recording_url TEXT, -- URL to Supabase Storage recording
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policy: Read via associated meeting's RLS
CREATE POLICY live_meetings_read_policy ON live_meetings
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE created_by = auth.uid()
      OR id IN (SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid())
    )
  );
```

---

#### Storage Bucket: `meeting-audio`

- **Type:** Public (or private with signed URLs)
- **Path Structure:** `{meeting_id}/{participant_id}_{timestamp}_{filename}` or `{meeting_id}/recording.webm`
- **Max File Size:** 100MB (for live recordings), 25MB (for uploaded files)
- **MIME Types:** Audio/video files

---

## 8. Authentication & Authorization

### Authentication Flow

1. **Signup**
   - User provides email, password, full name
   - Backend calls `supabase.auth.signUp()`
   - Supabase generates JWT and returns session
   - Frontend stores session in Supabase Auth storage
   - Optional: Email verification (if enabled in Supabase)

2. **Signin**
   - User provides email, password
   - Backend calls `supabase.auth.signInWithPassword()`
   - Supabase validates credentials and returns JWT
   - Frontend stores session
   - Token automatically includes user ID and email

3. **Token Refresh**
   - Supabase Auth automatically refreshes expired tokens
   - Axios interceptor detects 401 → calls `supabase.auth.refreshSession()`
   - New token obtained → retry original request

4. **Logout**
   - Frontend calls `supabase.auth.signOut()`
   - Session cleared from storage
   - Redirected to login page

### Authorization

#### Role-Based Access Control (RBAC)

**Organization Roles:**
- **Owner**: Can create/manage org, invite members, delete org
- **Member**: Can create meetings, view org meetings

**Meeting Permissions:**
- **Creator**: Full access (view, edit, delete, manage participants)
- **Participant**: Read-only access to transcript, notes, tasks
- **Other users**: No access

#### Enforcement

1. **Backend Middleware**
   - `authMiddleware` verifies JWT and attaches `req.user`
   - Routes check `req.user.id` against database ownership

2. **Database Row-Level Security (RLS)**
   - Every table has RLS policies
   - Policies use `auth.uid()` (from JWT) to filter rows
   - Even admin SDK calls respect RLS if policies are set correctly
   - Example: `meetings_read_policy` allows read only if:
     - User is creator (`created_by = auth.uid()`), OR
     - User is participant (exists in `meeting_participants`)

3. **Organization Verification**
   - Before creating a meeting in an org, verify user is member
   - Check: `organization_members` table has (user_id, organization_id)

### Authorization Rules Summary

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| Meeting | User | Creator, Participants | Creator | Creator |
| Task | Backend (auto) | Assignee, Participants, Creator | Assignee, Creator | Creator |
| Chat Message | Participant | Participants | - | - |
| Community Message | Participant | Participants | Own messages | Owner |
| Organization | User | Members | Owner | Owner |
| Organization Member | Owner | Members | Owner | Owner |

---

## 9. State Management & Data Flow

### Frontend State Management

#### 1. Authentication State
```javascript
// Via Supabase Auth client (native session storage)
const { data: { session }, error } = await supabase.auth.getSession();
// session.user contains: { id, email, user_metadata }
```

#### 2. Organization Context
```javascript
// contexts/OrganizationContext.jsx
export const OrganizationProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganization, setActiveOrganization] = useState(null);
  const [activeRole, setActiveRole] = useState('member');
  const [loading, setLoading] = useState(true);
  
  // Methods:
  // - refreshOrganizations() : Fetch all orgs from API
  // - setActiveOrganization(org) : Switch active org
  // - leaveOrganization(orgId) : Leave org
  
  return (
    <OrganizationContext.Provider value={{
      activeOrganization,
      activeRole,
      organizations,
      loading,
      ...methods
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};
```

#### 3. Local Component State
- **Dashboard**: `[meetings, setMeetings]` (fetched from API)
- **MeetingDetail**: `[meeting, setMeeting]`, `[tasks, setTasks]`, `[messages, setMessages]`
- **LiveMeeting**: `[peers, setPeers]`, `[localStream, setLocalStream]`, `[isMuted, setIsMuted]`
- **Chatbot**: `[messages, setMessages]`, `[input, setInput]`, `[loading, setLoading]`

#### 4. Global Fetching Strategy
- **Axios Interceptor** adds JWT to all requests
- **Error Handling**: 401 triggers refresh, then retry
- **Polling**: Dashboard polls `/api/meetings` every 30s for status
- **Focus Refetch**: `useRefetchOnFocus` hook refetches data when tab regains focus

---

### Data Flow Patterns

#### Pattern 1: API Call with Loading State
```javascript
const fetchMeetings = useCallback(async (orgId) => {
  try {
    setLoading(true);
    const data = await meetingsAPI.getAll(orgId);
    setMeetings(data.meetings || []);
    setError('');
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  fetchMeetings(activeOrganization?.id);
}, [activeOrganization?.id, fetchMeetings]);
```

#### Pattern 2: Real-Time Socket.io Events
```javascript
useEffect(() => {
  if (!roomId) return;
  
  const socket = io(SOCKET_URL);
  
  socket.on('connect', () => {
    socket.emit('join-room', { roomId, userId, userName });
  });
  
  socket.on('user-joined', ({ userId, socketId }) => {
    // Initiate WebRTC connection to new peer
    createPeerConnection(socketId);
  });
  
  socket.on('offer', ({ offer, from }) => {
    // Receive WebRTC offer, create answer
    handleOffer(offer, from);
  });
  
  return () => socket.disconnect();
}, [roomId]);
```

#### Pattern 3: Optimistic UI Update
```javascript
// Chatbot message submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Optimistically add to UI
  setMessages(prev => [...prev, {
    id: Date.now(),
    message: userMessage,
    response: '',
    created_at: new Date().toISOString()
  }]);
  
  try {
    // Make API call
    const data = await chatAPI.sendMessage(meetingId, userMessage);
    
    // Update with actual response
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempId ? { ...msg, response: data.response } : msg
      )
    );
  } catch (error) {
    // Remove optimistic message on error
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
  }
};
```

---

### WebRTC Peer Connection Lifecycle

```
User A joins room
  ↓
emit('join-room') via Socket.io
  ↓
Server broadcasts 'user-joined' to other peers (B, C)
  ↓
A emits 'offer' to B
  ↓
B receives offer → createAnswer() → emit 'answer' back to A
  ↓
A receives answer → setRemoteDescription()
  ↓
A & B exchange ICE candidates via socket
  ↓
P2P connection established → streams flowing
  ↓
When A mutes: toggleMute() → update local track enabled
  ↓
When meeting ends: close() all RTCPeerConnections
```

---

### Socket.io Events Reference

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `join-room` | Client → Server | `{ roomId, userId, userName }` | Join a live meeting room |
| `user-joined` | Server → Client | `{ userId, userName, socketId }` | Notify of new participant |
| `room-participants` | Server → Client | Array of participants | Send existing participants to new joiner |
| `offer` | Client → Client | `{ offer, from, userId, userName }` | WebRTC SDP offer |
| `answer` | Client → Client | `{ answer, from }` | WebRTC SDP answer |
| `ice-candidate` | Client → Client | `{ candidate, from }` | ICE candidate for NAT traversal |
| `mute-status` | Client → Broadcast | `{ userId, isMuted }` | Broadcast mute state |
| `user-left` | Server → Client | `{ userId, socketId }` | Participant disconnected |

---

## 10. Environment Variables & Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Supabase (from Supabase project settings)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq API
GROQ_API_KEY=gsk_your_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# SMTP Email (Optional - use ONE of the two below)
# Option 1: Generic SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false

# Option 2: Gmail App Password
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
GMAIL_SMTP_SECURE=false
```

**Variable Explanations:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Express server port | `5000` |
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Admin API key (service role) | Full JWT token |
| `GROQ_API_KEY` | Groq API key for LLM access | `gsk_...` |
| `FRONTEND_URL` | Allowed origin for CORS | `http://localhost:5173` |
| `SMTP_HOST` | Email server hostname | `smtp.gmail.com` |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials | Gmail account + app password |
| `GMAIL_*` | Gmail app password setup | Alternative to generic SMTP |

---

### Frontend Environment Variables

Create `frontend/.env` (or `.env.local`):

```env
# Supabase (public anon key, safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API & Socket URLs
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Optional: Deployment URLs
# VITE_API_URL=https://meeting-ai-3kyx.onrender.com/api
# VITE_SOCKET_URL=https://meeting-ai-3kyx.onrender.com
```

**Variable Explanations:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (public) | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key for client-side auth | JWT token |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Backend WebSocket URL | `http://localhost:5000` |

---

### Extension Configuration

Edit `extension/lib/config.js`:

```javascript
export const DEFAULT_API_BASE = 'http://localhost:5000/api';
export const DEFAULT_APP_URL = 'http://localhost:5173';
```

Or update via extension popup settings (persisted in `chrome.storage.sync`).

---

## 11. Installation & Local Setup

### Prerequisites

- **Node.js** 16+ (check: `node --version`)
- **npm** 7+ (check: `npm --version`)
- **Supabase** account (free tier available)
- **Groq API** key (free tier available)
- **Git** for version control

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/your-org/meeting-ai.git
cd meeting-ai
```

#### 2. Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project (choose region closest to you)
3. Copy project URL and keys:
   - Go to Settings → API
   - Copy `Project URL`
   - Copy `Service Role Key` (for backend)
   - Copy `Anon Key` (for frontend)
4. Create storage bucket:
   - Go to Storage → Create new bucket
   - Name: `meeting-audio`
   - Public (or private with signed URLs)
5. Run SQL migrations:
   - Go to SQL Editor
   - Execute the schema SQL (see [Database Models](#7-database--data-models) section)

#### 3. Groq API Setup

1. Sign up at [groq.com](https://groq.com)
2. Create API key from dashboard
3. Copy key for backend `.env`

#### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=gsk_...
FRONTEND_URL=http://localhost:5173
EOF

# Start development server (with auto-restart)
npm run dev

# Server runs on http://localhost:5000
```

#### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
EOF

# Start development server
npm run dev

# Frontend runs on http://localhost:5173
```

#### 6. Extension Setup (Optional - for Google Meet Recording)

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Navigate to `meeting-ai/extension` folder
5. Extension loaded! Icon appears in top-right
6. Click icon → Configure API Base URL and App URL if needed
7. Sign in with your Meeting AI account

### Verify Installation

**Backend:**
```bash
curl http://localhost:5000/api/auth/me
# Should return 401 (no token) - this is expected
```

**Frontend:**
- Open http://localhost:5173 in browser
- Should see landing page (no errors in console)
- Click "Get Started" → sign up form should render

**Real-Time Testing:**
- Open http://localhost:5173/create-live-meeting
- Should connect to Socket.io without errors
- Check browser console: "Socket connected" message

---

## 12. Deployment

### Frontend Deployment (Vercel)

1. **Push code to GitHub**
   ```bash
   git remote add origin https://github.com/your-org/meeting-ai.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import Git repository
   - Select `frontend` directory as root

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_API_URL = https://meeting-ai-3kyx.onrender.com/api
   VITE_SOCKET_URL = https://meeting-ai-3kyx.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - URL: `https://meeting-ai-psi.vercel.app` (custom domain available)

### Backend Deployment (Render)

1. **Push code to GitHub** (if not already)

2. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → Web Service
   - Connect GitHub and select repository
   - Select `backend` directory as root

3. **Configure Service**
   - **Name**: meeting-ai-backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Add Environment Variables**
   - Settings → Environment:
   ```
   PORT = 5000
   NODE_ENV = production
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   GROQ_API_KEY = gsk_...
   FRONTEND_URL = https://meeting-ai-psi.vercel.app
   SMTP_HOST = smtp.gmail.com
   GMAIL_USER = your-email@gmail.com
   GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx
   ```

5. **Deploy**
   - Click "Deploy"
   - Render builds and starts server
   - URL: `https://meeting-ai-3kyx.onrender.com`

### Custom Domain Setup

1. **Update DNS Records**
   - Point `meetingai.dev` to Vercel (frontend)
   - Point `api.meetingai.dev` to Render (backend)

2. **Configure HTTPS**
   - Both Vercel and Render handle SSL automatically

### WebSocket Configuration

**Important for Socket.io on Render:**
- Render supports WebSocket natively
- Set `transports: ['websocket', 'polling']` in Socket.io client options
- CORS already configured in `server.js` for allowed origins

---

## 13. Known Issues / Limitations

### Identified Issues

1. **Chrome Extension Manifest V3 Limitations**
   - Cannot capture video from Google Meet tabs (only audio)
   - Offscreen document workaround required for recording
   - Service worker has restricted API access compared to MV2

2. **Audio Quality Limitations**
   - WebM recording quality depends on browser (good on Chrome, may vary on Firefox)
   - Some audio codecs not universally supported
   - Noise suppression (RNNoise WASM) adds ~50ms latency

3. **Database Scaling**
   - Row-level Security (RLS) can be slow with very large datasets (>1M rows)
   - May need manual query optimization for large organizations
   - Consider partitioning tasks/messages by meeting_id

4. **Processing Queue**
   - No persistent job queue (uses in-memory async)
   - If backend crashes during processing, job is lost
   - Consider adding Redis + Bull for production

5. **File Upload Limits**
   - Max 25MB for uploaded audio files (multer limit)
   - Max 100MB for extension recordings (may be too large for slow connections)
   - No resumable uploads (single-shot only)

6. **Groq API Rate Limits**
   - Free tier: ~30 req/min (varies by endpoint)
   - Production use requires paid tier for high volume
   - No built-in rate limiting on backend (add middleware if needed)

7. **Email Service Dependency**
   - Organization invites require SMTP configuration
   - Gmail app passwords can fail on certain cloud platforms
   - No fallback if email service unavailable

8. **Real-Time Synchronization**
   - Community chat uses polling (not real-time subscriptions)
   - May have 3-5 second delays between messages
   - Consider Supabase real-time for low-latency chat

9. **Storage Space**
   - Supabase free tier: 1GB storage
   - Large audio files quickly consume quota
   - No automatic cleanup/archival of old recordings

### Incomplete Features

1. **Screen Sharing** - Partially implemented (flag exists but UI not complete)
2. **Video Recording** - Only audio is recorded (not peer video)
3. **Task Status Tracking** - Tasks marked complete but no history/timeline
4. **Meeting Search** - Dashboard lacks full-text search on transcripts
5. **Analytics** - No usage metrics or dashboards
6. **Billing** - No payment integration
7. **API Rate Limiting** - No protection against abuse

---

## 14. Future Improvements

### High Priority

1. **Persistent Job Queue**
   - Replace async/await with Redis + Bull
   - Guarantees processing completes even if server restarts
   - Enables monitoring and retry logic
   - **Implementation**: Install `bull`, set up Redis instance, refactor `processLiveMeetingAsync()`

2. **Real-Time Chat Updates**
   - Replace polling with Supabase real-time subscriptions
   - Community messages appear instantly
   - Reduce API calls by ~90%
   - **Implementation**: Use `supabase.on('postgres_changes', ...)` in MeetingDetail

3. **Full-Text Search**
   - Add PostgreSQL full-text search on transcripts
   - Users can search across all meeting content
   - Dashboard search bar filters meetings by title/transcript
   - **Implementation**: Add `tsvector` column, GIN index; implement `/api/search` endpoint

4. **Video Recording & Playback**
   - Currently only records audio
   - Extend RecordRTC to capture video from peer streams
   - Store as MP4 with audio+video
   - Add video player to meeting detail
   - **Complexity**: High (video codec handling, larger storage needs)

5. **Screen Share**
   - Already detected in codebase, needs UI completion
   - Host can share screen during live meeting
   - Video feed switches between camera and screen
   - **Implementation**: Complete `toggleScreenShare()` in useWebRTC hook, add button to UI

### Medium Priority

6. **Transcription Language Support**
   - Currently auto-translates to English
   - Option to keep original language or multilingual transcripts
   - **Implementation**: Add language selector in CreateMeeting; pass to Whisper API

7. **Custom LLM Prompts**
   - Let users customize note structure, task extraction logic
   - Organizations can define custom templates
   - **Implementation**: Add templates table, UX in org settings

8. **Meeting Analytics Dashboard**
   - Metrics: total meetings, avg attendees, transcription time, cost
   - Usage charts over time
   - Team member activity
   - **Implementation**: Create new analytics page, aggregate queries

9. **Zapier/IFTTT Integration**
   - Send extracted tasks to Asana, Monday.com, Jira
   - Sync attendees with calendar apps
   - **Implementation**: Add webhooks, build public API

10. **Mobile App**
    - React Native version for iOS/Android
    - Join live meetings from phone
    - View transcripts on the go
    - **Implementation**: Expo + React Native code sharing

### Low Priority

11. **AI Meeting Assistant in Real-Time**
    - During live meeting, get real-time insights
    - Suggest when decisions are being made
    - Alert about missing action items
    - **Implementation**: Stream transcript chunks to LLM; display suggestions in sidebar

12. **Meeting Summaries for Executives**
    - Weekly digest of all team meetings
    - Key decisions and blockers across org
    - **Implementation**: Scheduled job that aggregates notes, generates summary

13. **Sentiment Analysis**
    - Detect sentiment of participants
    - Identify heated discussions or disagreements
    - **Implementation**: Call Groq with sentiment classification prompt

14. **Accessibility Features**
    - Closed captions during live meeting
    - Screen reader optimization
    - High contrast mode
    - **Implementation**: Add captions via Whisper real-time; audit UI

15. **Multi-Language UI**
    - Support Spanish, French, German, etc.
    - Internationalization (i18n) setup
    - **Implementation**: Add i18next library

---

## Conclusion

Meeting AI is a sophisticated, production-ready platform that intelligently automates meeting workflows. It combines cutting-edge technologies (WebRTC, LLMs, real-time signaling) to deliver a seamless, secure, and scalable solution for modern teams.

The architecture is designed for **performance**, **security**, and **extensibility**:
- **Performance**: Groq LPU hardware enables sub-second transcription; WebRTC provides p2p efficiency
- **Security**: Supabase RLS enforces data privacy; JWT tokens ensure authentication
- **Extensibility**: Modular services, clear API boundaries, and event-driven signaling allow easy addition of features

For questions, issues, or contributions, refer to the project GitHub repository and contribution guidelines.

---

**Document Generated**: January 15, 2025  
**Version**: 1.0.0  
**Last Updated**: January 15, 2025

