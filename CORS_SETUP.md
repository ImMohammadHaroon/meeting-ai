# CORS Configuration Guide

## Current Status
✅ Backend CORS headers have been added to `vercel.json`
✅ Backend server.js has proper CORS middleware configured
⚠️ Frontend `.env` file needs to be created manually (it's gitignored)

## Issues Fixed

### 1. Backend vercel.json - CORS Headers Added
The backend's `vercel.json` now includes proper CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Credentials: true`

### 2. Hardcoded Frontend URLs in Backend
Your backend currently has these hardcoded URLs in `server.js` (lines 23-29):
```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://meeting-ai-wn5o.vercel.app', // Frontend Vercel URL
    'https://meeting-ai-seven.vercel.app', // Backend Vercel URL
    process.env.FRONTEND_URL
];
```

## Required Manual Steps

### Step 1: Create Frontend .env File
Create `d:\meeting\frontend\.env` with this content:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 2: Update Backend Allowed Origins
When you deploy, update lines 26-27 in `backend/src/server.js` with your actual Vercel URLs:
- Line 26: Your frontend Vercel URL
- Line 27: Your backend Vercel URL

### Step 3: Set Environment Variables on Vercel

#### For Backend Deployment:
Add these environment variables in Vercel dashboard:
- `FRONTEND_URL`: Your frontend Vercel URL (e.g., https://meeting-ai-wn5o.vercel.app)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `GROQ_API_KEY`: Your Groq API key

#### For Frontend Deployment:
Add these environment variables in Vercel dashboard:
- `VITE_API_URL`: Your backend Vercel URL + /api (e.g., https://meeting-ai-seven.vercel.app/api)
- `VITE_SOCKET_URL`: Your backend Vercel URL (e.g., https://meeting-ai-seven.vercel.app)

## Common CORS Errors & Solutions

### Error: "No 'Access-Control-Allow-Origin' header"
**Solution**: Make sure your backend URL in the frontend .env matches your deployed backend

### Error: "CORS preflight request failed"
**Solution**: Ensure OPTIONS method is allowed in CORS configuration (already added)

### Error: "Credentials flag is 'true', but Access-Control-Allow-Credentials is not"
**Solution**: Already fixed by adding credentials: true in both server.js and vercel.json

## Testing CORS Configuration

### Local Testing:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Frontend should connect to `http://localhost:5000/api`

### Production Testing:
1. Deploy backend to Vercel
2. Copy the backend URL
3. Update frontend `.env` with production values
4. Deploy frontend to Vercel
5. Test all API calls

## Current Backend CORS Configuration (server.js)

The backend already has comprehensive CORS setup:
- Allows multiple origins (development + production)
- Supports credentials
- Allows all necessary HTTP methods
- Properly configured headers

## Security Note

For production, consider replacing `Access-Control-Allow-Origin: *` in vercel.json with specific origins:
```json
"Access-Control-Allow-Origin": "https://your-frontend-url.vercel.app"
```

This is more secure but requires updating when your frontend URL changes.
