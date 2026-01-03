# Meeting AI - Full-Stack Application

A production-ready meeting management application with AI-powered transcription, notes generation, task extraction, and context-aware chatbot.

## 🚀 Quick Deploy

**For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

⚠️ **Important**: This app uses Socket.io for live meetings. Vercel serverless functions don't support WebSockets. Deploy the backend to Railway/Render for full functionality.

## Features

- **Authentication**: Secure user authentication with Supabase
- **Meeting Management**: Create meetings with multiple participants
- **Live Meetings**: Real-time WebRTC video/audio calls
- **Audio Transcription**: Automatic transcription using Groq Whisper API
- **AI-Generated Notes**: Smart meeting notes and summaries
- **Task Extraction**: Automatically extract action items with assignees
- **Meeting Chatbot**: Context-aware chatbot for each meeting
- **Responsive Design**: Professional glassmorphism UI

## Tech Stack

### Frontend
- React.js with Vite
- Tailwind CSS
- React Router
- Axios
- Supabase Client

### Backend
- Node.js with Express
- Supabase (Auth, Database, Storage)
- Groq SDK (Whisper, LLaMA)
- Multer for file uploads

## Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- Groq API key

## Setup Instructions

### 1. Supabase Configuration

Create a new Supabase project at [https://supabase.com](https://supabase.com)

#### Create Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Meetings table
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  transcript TEXT,
  notes TEXT
);

-- Meeting participants table
CREATE TABLE meeting_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings they created or participate in"
  ON meetings FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM meeting_participants
      WHERE meeting_participants.meeting_id = meetings.id
      AND meeting_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = created_by);

-- RLS Policies for meeting_participants
CREATE POLICY "Users can view participants of their meetings"
  ON meeting_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND (meetings.created_by = auth.uid() OR meeting_participants.user_id = auth.uid())
    )
  );

CREATE POLICY "Meeting creators can manage participants"
  ON meeting_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks from their meetings"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = tasks.meeting_id
      AND (
        meetings.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM meeting_participants
          WHERE meeting_participants.meeting_id = meetings.id
          AND meeting_participants.user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view chat from their meetings"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = chat_messages.meeting_id
      AND (
        meetings.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM meeting_participants
          WHERE meeting_participants.meeting_id = meetings.id
          AND meeting_participants.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create chat messages in their meetings"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = chat_messages.meeting_id
      AND (
        meetings.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM meeting_participants
          WHERE meeting_participants.meeting_id = meetings.id
          AND meeting_participants.user_id = auth.uid()
        )
      )
    )
  );
```

#### Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `meeting-audio`
3. Make it public or configure RLS policies as needed

### 2. Environment Variables

#### Backend (.env)
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
```

#### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Development

Run backend and frontend servers concurrently:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Backend will run on `http://localhost:5000`
Frontend will run on `http://localhost:5173`

## Deployment to Vercel

### Frontend Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set build command: `cd frontend && npm install && npm run build`
4. Set output directory: `frontend/dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your backend URL)

### Backend Deployment

Option 1: Deploy as Vercel Serverless Function
- Add `vercel.json` configuration
- Update routes to serverless functions

Option 2: Deploy to another service (Heroku, Railway, Render)
- Set environment variables
- Configure for production

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users

### Meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - List meetings
- `GET /api/meetings/:id` - Get meeting details
- `POST /api/meetings/:id/upload` - Upload audio files
- `POST /api/meetings/:id/process` - Trigger AI processing
- `GET /api/meetings/:id/status` - Get processing status

### Chat
- `POST /api/meetings/:id/chat` - Send chat message
- `GET /api/meetings/:id/chat/history` - Get chat history

## Usage

1. **Sign Up**: Create an account
2. **Create Meeting**: Add title, description, select participants, upload audio files
3. **Processing**: Audio is automatically transcribed and analyzed
4. **View Results**: See transcript, notes, and extracted tasks
5. **Chat**: Ask questions about the meeting

## License

MIT
