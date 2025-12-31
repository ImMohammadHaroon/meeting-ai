# Live Meeting Setup Guide

This guide will help you set up and configure the live meeting feature for Meet AI.

## Prerequisites

- Supabase account and project
- Groq API account
- Backend and frontend already set up

## Step 1: Database Migration

Run the live meetings migration SQL in your Supabase SQL Editor:

1. Go to https://supabase.com
2. Open your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the contents of `LIVE_MEETINGS_MIGRATION.sql`
6. Paste and click **Run** (or Ctrl+Enter)
7. Verify success message appears

## Step 2: Environment Variables

### Backend (.env)

Add the following to `backend/.env`:

```
# Groq API (existing)
GROQ_API_KEY=your_groq_api_key_here

# AI Bot Configuration (Optional)
AI_BOT_EMAIL=ai-bot@meetai.internal
AI_BOT_PASSWORD=secure_password_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# (Optional) TURN Server for production WebRTC
TURN_SERVER_URL=turn:global.turn.twilio.com:3478
TURN_USERNAME=your_username
TURN_CREDENTIAL=your_credential
```

**Note:** You should already have `GROQ_API_KEY` set from the existing meeting functionality. The same API key will be used for live meetings.

### Frontend (.env)

Add the following to `frontend/.env`:

```
# Existing variables
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Socket.io URL for WebRTC signaling
VITE_SOCKET_URL=http://localhost:5000
```

## Step 3: Verify Groq API Key

Your existing Groq API key will be used for live meeting processing:
- Whisper for audio transcription
- Llama models for notes and task generation

**No additional API keys needed!**

## Step 4: Create AI Bot User (Optional)

If you want the AI bot to appear in the participant list:

1. Go to Supabase Dashboard → Authentication → Users
2. Click **Add user** → **Create new user**
3. Email: `ai-bot@meetai.internal`
4. Password: (choose a secure password)
5. Auto-confirm user: Yes
6. Click **Create user**
7. Add the bot email and password to `backend/.env`

**If you skip this step**, the AI bot creation will fail silently and meetings will still work.

## Step 5: Install Dependencies

Dependencies should already be installed. Verify:

### Backend
```bash
cd backend
npm install
# Verify socket.io, nanoid are installed
```

### Frontend
```bash
cd frontend
npm install
# Verify socket.io-client is installed
```

## Step 6: Restart Servers

Restart both backend and frontend servers to load new environment variables:

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## Step 7: Test the Feature

1. **Create Live Meeting**
   - Navigate to http://localhost:5173/dashboard
   - Click **+ Create Live Meeting**
   - Fill in meeting title, description, and select participants
   - Click **Create Live Meeting**
   - Copy the join URL

2. **Start Meeting**
   - Click **Start Meeting** button
   - Allow microphone access when prompted
   - Verify you see yourself in the participant list

3. **Join from Another Device/Browser**
   - Open the join URL in another browser (or incognito window)
   - Sign in as a different user (who was invited)
   - Allow microphone access
   - Verify both participants appear in participant list
   - Test audio by speaking

4. **Test Controls**
   - Click mute/unmute button
   - Verify muted icon appears
   - Speak and verify speaking indicator (green ring around avatar)
   - Test timer is running

5. **End Meeting**
   - As the meeting creator, click **End Meeting**
   - Confirm the prompt
   - Wait for recording upload
   - Verify redirect to meeting detail page
   - Wait for processing to complete (Groq will process the audio)
   - Check for transcript, notes, and tasks

## Troubleshooting

### Microphone Access Denied
- Clear browser permissions
- Reload page and allow microphone when prompted
- Check browser console for errors

### Connection Issues
- Verify Socket.io is running (check backend logs for "Socket.io server ready")
- Check `VITE_SOCKET_URL` matches your backend URL
- Ensure CORS is configured correctly in backend

### Audio Not Heard
- Check both users have unmuted
- Verify speakers/headphones are working
- Open browser console and check for WebRTC errors
- In production, you may need a TURN server for NAT traversal

### Recording Upload Fails
- Check file size (browser may timeout on very long meetings)
- Verify Supabase storage bucket permissions
- Check backend logs for upload errors

### Processing Fails
- Verify `GROQ_API_KEY` is set correctly
- Check backend logs for Groq API errors
- Ensure you have Groq API credits
- Check Supabase database for error messages in meeting notes

## Production Deployment

### WebSocket Considerations

If deploying to **Vercel** or other serverless platforms:
- Vercel does not support long-lived WebSocket connections well
- Consider deploying backend to:
  - Render (https://render.com) - free tier available
  - Railway (https://railway.app)
  - Fly.io (https://fly.io)
  - DigitalOcean App Platform

### Environment Variables

Set all environment variables in your deployment platform:
- Backend: `GROQ_API_KEY`, `FRONTEND_URL`, bot credentials, TURN server
- Frontend: `VITE_SOCKET_URL` (point to deployed backend)

### TURN Server for Production

For reliable WebRTC across all network types, configure a TURN server:

**Free Option: Google STUN**
- Already configured in code (Google STUN servers)

**Paid Option: Twilio TURN**
1. Sign up at https://www.twilio.com
2. Get STUN/TURN credentials
3. Add to backend `.env`:
   ```
   TURN_SERVER_URL=turn:global.turn.twilio.com:3478
   TURN_USERNAME=your_username
   TURN_CREDENTIAL=your_credential
   ```

## Feature Limits

- **Meeting Duration:** No hard limit, but very long recordings may timeout during upload
- **Participants:** No hard limit, but WebRTC performance may degrade beyond 8-10 participants
- **Recording Size:** Limited by browser and Supabase storage limits
- **Transcription:** Limited by Groq API quotas

## Next Steps

- Test the feature end-to-end
- Invite team members to test multi-user meetings
- Monitor Groq API usage
- Consider adding features like:
  - Scheduled meetings with calendar integration
  - Meeting recordings download
  - Real-time transcription (advanced)
  - Screen sharing (requires additional WebRTC streams)

---

For issues or questions, check:
- Backend logs: `backend/` terminal
- Frontend console: Browser DevTools
- Supabase logs: Supabase Dashboard → Logs
- Groq API logs: Groq Dashboard
