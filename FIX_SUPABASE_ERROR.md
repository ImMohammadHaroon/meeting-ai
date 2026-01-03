# 🔴 ERROR FIX: "Failed to fetch" - Supabase Configuration Missing

## Problem
You're getting a "TypeError: Failed to fetch" error because your **frontend `.env` file is missing Supabase credentials**.

## Quick Fix (3 Steps)

### Step 1: Get Your Supabase Credentials

Go to your Supabase Dashboard: https://supabase.com

1. Open your project
2. Click **Settings** (⚙️) → **API**
3. Copy these two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2: Create Frontend .env File

**Manually create** the file `d:\meeting\frontend\.env` with this content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=PASTE_YOUR_PROJECT_URL_HERE
VITE_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE

# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Socket.io URL
VITE_SOCKET_URL=http://localhost:5000
```

**Example** (replace with your actual values):
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Restart Frontend

After creating the `.env` file:

1. **Stop** your frontend dev server (Ctrl+C in the terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```

## Why This Error Happened

Your `frontend/src/services/supabase.js` file checks for these environment variables:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

Without them, Supabase can't connect, causing authentication to fail.

## Verify It Works

After restarting, try to sign in again. You should see:
- ✅ No console errors
- ✅ Successful authentication
- ✅ Redirect to dashboard

## Still Getting Errors?

### Check for typos:
- ❌ Wrong: `VITE_SUPABASE_URL = https://...` (no spaces around =)
- ✅ Right: `VITE_SUPABASE_URL=https://...`

### Check file location:
- File must be at: `d:\meeting\frontend\.env` (NOT in `d:\meeting\.env`)
- File name must be exactly `.env` (with the dot at the start)

### Check you copied the correct keys:
- URL should start with `https://` and end with `.supabase.co`
- Anon key is a very long string (200+ characters) starting with `eyJ`

## Complete Environment Setup

For reference, here's what each environment file should contain:

### Backend `.env` (d:\meeting\backend\.env)
```env
PORT=5000
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
```

### Frontend `.env` (d:\meeting\frontend\.env)
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Reference Documentation

For detailed setup instructions, see:
- [`STEP_3_GET_API_KEYS.md`](./STEP_3_GET_API_KEYS.md) - Complete API keys setup guide
- [`CORS_SETUP.md`](./CORS_SETUP.md) - CORS configuration guide
