# Meeting AI — Complete Project Documentation

> A full-stack, AI-powered meeting management platform that transforms raw audio into transcripts, structured notes, action items, and an interactive Q&A assistant.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Features](#2-core-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Project Structure](#5-project-structure)
6. [API Endpoints](#6-api-endpoints)
7. [Database Schema](#7-database-schema)
8. [Frontend Components](#8-frontend-components)
9. [Services & Hooks](#9-services--hooks)
10. [Environment Variables](#10-environment-variables)
11. [Deployment](#11-deployment)
12. [Development Setup](#12-development-setup)

---

## 1. Overview

**Meeting AI** is a production-grade full-stack application that eliminates meeting workflow inefficiencies. By integrating LLMs and real-time communication technologies, it automates the entire post-meeting process—from transcription to task assignment—allowing teams to focus on collaboration.

### Live Demo
- **URL**: https://meetingai.dev

### Value Proposition
- **Real-Time Conferencing**: WebRTC for peer-to-peer audio/video, managed by Socket.io signaling
- **High-Fidelity Transcription**: Groq Whisper API for rapid, accurate audio-to-text with auto-translation
- **Intelligent Summarization**: LLaMA 3.3 generates structured meeting notes
- **Automated Task Extraction**: LLM-driven action item identification with assignee detection
- **Contextual Q&A Chatbot**: AI assistant using meeting transcript as knowledge base
- **Secure Organization Management**: Supabase Auth + PostgreSQL RLS for domain-based access

---

## 2. Core Features

### 2.1 Authentication & Users
- Email/password signup and signin via Supabase Auth
- JWT-based session management
- Protected routes for authenticated users
- User profile with full name

### 2.2 Meeting Management
- **Standard Meetings**: Multiple participants with individual audio uploads
- **Group Meetings**: Single audio file for entire group
- **Meeting Processing Pipeline**:
  1. Upload audio files to Supabase Storage
  2. Transcription via Groq Whisper API
  3. Translation to English (if needed)
  4. Summarization via LLaMA 3.3
  5. Task extraction with assignee detection

### 2.3 Live Meetings
- WebRTC peer-to-peer audio (video disabled by default)
- Socket.io signaling for connection establishment
- 12-character unique room IDs
- Start/End meeting controls
- Recording upload capability
- AI bot participant support
- Screen sharing functionality

### 2.4 Chatbot (Q&A)
- Context-aware AI assistant
- Uses meeting transcript as knowledge base
- Answers specific questions about meeting content
- Real-time responses via Groq LLaMA

### 2.5 Organization Management
- Create organizations with unique slug and invite code
- Domain-based membership (email domain matching)
- Multi-organization support per user
- Role-based permissions: `admin` or `member`
- Invite code regeneration
- Member invitation via email
- Organization switching

### 2.6 Audio Features
- Browser-based audio recording (RecordRTC)
- Audio upload with limits (25MB standard, 100MB live)
- Supported formats: MP3, WAV, M4A, OGG, WebM

---

## 3. Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool |
| Tailwind CSS | 3.4.19 | Styling |
| React Router DOM | 7.11.0 | Routing |
| Socket.io Client | 4.8.3 | Real-time Communication |
| Supabase JS | 2.89.0 | Backend Client |
| Axios | 1.13.2 | HTTP Client |
| Framer Motion | 12.35.0 | Animations |
| RecordRTC | 5.6.2 | Audio Recording |
| React Markdown | 10.1.0 | Markdown Rendering |
| Lucide React | 0.562.0 | Icons |
| Three.js | 0.183.2 | 3D Rendering |
| React Three Fiber | 9.5.0 | React Three.js |
| React Three Drei | 10.7.7 | React Three.js helpers |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | Latest | Runtime |
| Express | 5.2.1 | Web Framework |
| Socket.io | 4.8.3 | WebSockets & Signaling |
| Groq SDK | 0.37.0 | AI Services |
| Supabase JS | 2.89.0 | Database/Auth |
| Multer | 2.0.2 | File Upload |
| Nodemailer | 7.0.13 | Email Service |
| Nanoid | 5.1.6 | ID Generation |
| Dotenv | 17.2.3 | Environment |
| Cors | 2.8.5 | CORS Handling |
| Form-data | 4.0.5 | Multipart Data |
| Nodemon | 3.1.11 | Hot Reload |

---

## 4. Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Pages     │  │ Components  │  │   Hooks     │             │
│  │ - Dashboard │  │ - Chatbot   │  │ - useWebRTC │             │
│  │ - Meeting   │  │ - Protected  │  │ - useAuth   │             │
│  │ - Live      │  │   Route      │  │ - useAudio  │             │
│  │ - Landing   │  │ - UI (3D)    │  │   Recorder  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Contexts: OrganizationContext (multi-org state management) ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Express + Node)                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Routes: auth, meetings, liveMeetings, organizations, chat    ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────┐  ┌─────────────────────────────────────────────┐│
│  │ Middleware  │  │ Services: groq, storage, email, processLive  ││
│  │ - auth.js   │  └─────────────────────────────────────────────┘│
│  └─────────────┘  ┌─────────────────────────────────────────────┐│
│                    │ Socket.io (WebRTC Signaling)              ││
│                    └─────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SUPABASE      │  │      GROQ       │  │  SUPABASE       │
│   PostgreSQL    │  │   (LLM/Whisper) │  │  Storage        │
│   + Auth + RLS  │  │                 │  │  (Audio Files)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Data Flow

1. **Authentication Flow**:
   - User signs up/signs in via Supabase Auth
   - JWT token stored in frontend
   - Token sent in Authorization header

2. **Meeting Creation Flow**:
   - User creates meeting with participants
   - Meeting record created in PostgreSQL
   - Audio files uploaded to Supabase Storage
   - Processing triggered (transcription + summarization)

3. **Live Meeting Flow**:
   - Room created with unique room_id
   - Socket.io handles signaling for WebRTC
   - ICE candidates exchanged between peers
   - Audio streams established peer-to-peer

---

## 5. Project Structure

### Directory Tree

```
meeting-ai/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── groq.js              # Groq SDK config
│   │   │   └── supabase.js         # Supabase client
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT auth middleware
│   │   ├── routes/
│   │   │   ├── auth.js             # /api/auth endpoints
│   │   │   ├── users.js            # /api/users endpoints
│   │   │   ├── meetings.js         # /api/meetings endpoints
│   │   │   ├── chat.js             # Meeting chatbot endpoints
│   │   │   ├── chat_community.js   # Community chat endpoints
│   │   │   ├── liveMeetings.js     # Live meeting endpoints
│   │   │   └── organizations.js    # Organization endpoints
│   │   ├── services/
│   │   │   ├── groqService.js      # Transcription & summarization
│   │   │   ├── storageService.js  # Supabase Storage operations
│   │   │   ├── email.js           # Email invitation service
│   │   │   └── processLiveMeeting.js # Live recording processor
│   │   ├── sockets/
│   │   │   └── signalingHandler.js # WebRTC signaling
│   │   └── server.js              # Express entry point
│   ├── package.json
│   ├── nodemon.json
│   ├── vercel.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # UI components (3D, animations)
│   │   │   ├── Chatbot.jsx        # AI Q&A chatbot
│   │   │   ├── MobileDrawer.jsx   # Mobile nav drawer
│   │   │   ├── ProtectedRoute.jsx  # Auth guard
│   │   │   ├── OwlSplash.jsx      # Splash animation
│   │   │   ├── OrganizationSwitcher.jsx
│   │   │   ├── OrganizationPanel.jsx
│   │   │   └── OrganizationSetupModal.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Public landing page
│   │   │   ├── SignIn.jsx         # Login page
│   │   │   ├── SignUp.jsx         # Registration
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── CreateMeeting.jsx  # Create standard meeting
│   │   │   ├── CreateGroupMeeting.jsx # Group meeting
│   │   │   ├── MeetingDetail.jsx  # Meeting view & chat
│   │   │   ├── CreateLiveMeeting.jsx # Create live meeting
│   │   │   └── LiveMeeting.jsx    # Live meeting room
│   │   ├── hooks/
│   │   │   ├── useAuth.js         # Authentication
│   │   │   ├── useWebRTC.js       # WebRTC connection
│   │   │   ├── useAudioRecorder.js # Audio recording
│   │   │   └── useMediaQuery.js   # Responsive breakpoints
│   │   ├── contexts/
│   │   │   └── OrganizationContext.jsx # Org state
│   │   ├── services/
│   │   │   ├── api.js            # Axios client
│   │   │   └── supabase.js      # Supabase client
│   │   ├── lib/
│   │   │   └── utils.ts         # Utilities
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # React entry
│   │   ├── index.css           # Tailwind styles
│   │   └── App.css             # App styles
│   ├── public/
│   ├── dist/                   # Production build
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.cjs
│   ├── postcss.config.cjs
│   ├── eslint.config.js
│   ├── vercel.json
│   └── .env
│
├── README.md
└── PROJECT_DOCUMENTATION.md
```

---

## 6. API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/signin` | Sign in user |
| POST | `/signout` | Sign out user |
| GET | `/me` | Get current user |

### Meetings (`/api/meetings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all meetings for user |
| POST | `/` | Create new meeting |
| GET | `/:id` | Get meeting details |
| POST | `/:id/upload` | Upload audio files |
| POST | `/:id/process` | Process meeting |
| GET | `/:id/status` | Get processing status |
| DELETE | `/:id` | Delete meeting |

### Live Meetings (`/api/live-meetings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create live meeting |
| GET | `/:id` | Get live meeting details |
| POST | `/:id/start` | Start meeting |
| POST | `/:id/end` | End meeting |
| POST | `/:id/upload-recording` | Upload recording |
| POST | `/:id/join` | Record user join |
| POST | `/:id/leave` | Record user leave |

### Organizations (`/api/organizations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current organization |
| GET | `/all` | Get all user's organizations |
| POST | `/` | Create new organization |
| POST | `/join` | Join with invite code |
| POST | `/switch` | Switch active organization |
| POST | `/leave` | Leave organization |
| GET | `/members` | Get organization members |
| POST | `/regenerate-invite` | New invite code (admin) |
| POST | `/invite` | Send invitation email |
| DELETE | `/members/:userId` | Remove member (admin) |

### Chat (`/api/meetings/:id`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat` | Get chat history |
| POST | `/chat` | Send message to chatbot |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |
| GET | `/api/cors-check` | CORS diagnostic |

---

## 7. Database Schema

### Tables

#### `organizations`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Organization name |
| slug | text | URL-friendly identifier |
| domain | text | Email domain for membership |
| invite_code | text | 6-char invite code |
| created_by | uuid | Creator user ID |
| created_at | timestamp | Creation timestamp |

#### `organization_members`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| user_id | uuid | FK to auth.users |
| role | text | 'admin' or 'member' |
| joined_at | timestamp | Join timestamp |

#### `meetings`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Meeting title |
| description | text | Meeting description |
| created_by | uuid | Creator user ID |
| organization_id | uuid | FK to organizations (nullable) |
| type | text | 'standard' or 'group' |
| transcript | text | Full transcript |
| notes | text | Generated meeting notes |
| audio_file_url | text | Audio file path (group) |
| processed | boolean | Processing status |
| created_at | timestamp | Creation timestamp |

#### `meeting_participants`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| meeting_id | uuid | FK to meetings |
| user_id | uuid | Participant user ID |
| audio_file_url | text | Individual audio file |

#### `tasks`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| meeting_id | uuid | FK to meetings |
| title | text | Task title |
| assignee_id | uuid | Assigned user ID |
| completed | boolean | Completion status |
| created_at | timestamp | Creation timestamp |

#### `chat_history`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| meeting_id | uuid | FK to meetings |
| user_id | uuid | User ID |
| message | text | User message |
| response | text | AI response |
| created_at | timestamp | Timestamp |

#### `community_chat`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| meeting_id | uuid | FK to meetings |
| user_id | uuid | User ID |
| message | text | Message content |
| created_at | timestamp | Timestamp |

#### `live_meetings`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| meeting_id | uuid | FK to meetings |
| room_id | text | Unique room identifier |
| status | text | 'scheduled', 'live', 'ended' |
| started_at | timestamp | Start timestamp |
| ended_at | timestamp | End timestamp |
| recording_url | text | Recording file path |

#### `live_participants`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| live_meeting_id | uuid | FK to live_meetings |
| user_id | uuid | User ID |
| is_bot | boolean | Is AI bot |
| is_connected | boolean | Connection status |
| joined_at | timestamp | Join timestamp |
| left_at | timestamp | Leave timestamp |

#### `meeting_recordings`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| live_meeting_id | uuid | FK to live_meetings |
| file_url | text | Recording path |
| file_size | integer | File size in bytes |

### Row Level Security (RLS)
- Organizations: Members can only access their own org data
- Meetings: Creator and participants can access
- Tasks: Assignee and meeting creator can access
- Chat: Meeting participants only
- Live meetings: Creator and invited participants

---

## 8. Frontend Components

### Pages

| Page | Route | Description |
|------|-------|-------------|
| LandingPage | `/` | Public landing with 3D elements |
| SignIn | `/signin` | Login form |
| SignUp | `/signup` | Registration form |
| Dashboard | `/dashboard` | Meeting list and actions |
| CreateMeeting | `/create-meeting` | Create standard meeting |
| CreateGroupMeeting | `/create-group-meeting` | Create group meeting |
| MeetingDetail | `/meetings/:id` | View meeting, transcript, tasks, chatbot |
| CreateLiveMeeting | `/create-live-meeting` | Create live meeting |
| LiveMeeting | `/live-meeting/:id` | WebRTC audio room |

### Reusable Components

| Component | Purpose |
|-----------|---------|
| Chatbot.jsx | AI Q&A interface |
| MobileDrawer.jsx | Mobile navigation |
| ProtectedRoute.jsx | Auth guard |
| OwlSplash.jsx | Animated splash |
| OrganizationSwitcher.jsx | Org selector |
| OrganizationPanel.jsx | Org management |
| OrganizationSetupModal.jsx | Create/join org |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| useAuth.js | Session management |
| useWebRTC.js | WebRTC connections |
| useAudioRecorder.js | Audio recording |
| useMediaQuery.js | Responsive detection |

### Context

| Context | Purpose |
|---------|---------|
| OrganizationContext.jsx | Global org state |

---

## 9. Services & Hooks

### Backend Services

#### groqService.js
```javascript
transcribeAudio(buffer, fileName)     // Whisper transcription
generateNotes(transcript, title)      // LLaMA summarization
extractTasks(transcript, participants)  // Task extraction
extractGroupTasks(transcript, participants) // Group tasks
chatWithTranscript(meetingId, question) // Q&A chatbot
```

#### storageService.js
```javascript
uploadAudioFile(file, meetingId, prefix)  // Upload to Supabase
downloadAudioFile(url)  // Download for processing
```

#### email.js
```javascript
sendInvitationEmail({ to, organizationName, inviteCode, inviterName, signupUrl })
```

### Frontend Services

#### api.js
- Axios instance with base URL
- Auth interceptor for JWT tokens

#### supabase.js
- Supabase client initialization

---

## 10. Environment Variables

### Backend (.env)
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=http://localhost:5173
# Optional: SMTP for emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
AI_BOT_EMAIL=ai-bot@meetai.internal
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

---

## 11. Deployment

### Frontend
- **Platform**: Vercel (recommended) or Netlify
- **Build**: `npm run build`
- **Output**: `dist`

### Backend
**Important**: Live meetings require WebSocket support.

**Recommended**:
- Railway
- Render
- DigitalOcean Droplet
- AWS EC2

**Not Recommended**:
- Vercel Serverless (WebSocket limitations)

### Database
- Supabase (PostgreSQL with Auth, Storage, RLS)

---

## 12. Development Setup

### Prerequisites
- Node.js 16+
- Supabase account
- Groq API key

### Installation
```bash
# Install backend
cd backend && npm install

# Install frontend
cd frontend && npm install
```

### Running Locally
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Access at `http://localhost:5173`

### Supabase Setup
1. Create Supabase project
2. Create tables with RLS policies
3. Create storage bucket: `meeting-audio` (public)

---

## Known Limitations

1. **WebSocket on Serverless**: Live meetings need persistent connections - not fully supported on Vercel
2. **Audio File Size**: 25MB max standard, 100MB max live recordings
3. **Supported Formats**: MP3, WAV, M4A, OGG, WebM
4. **Browser Support**: Modern browsers with getUserMedia required

---

## License

MIT License - See [README.md](README.md) for details.