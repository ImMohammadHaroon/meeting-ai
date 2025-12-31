# Step 3: API Keys Copy Karo

## Kya Karna Hai

Supabase aur Groq ke API keys copy karke environment files mein paste karna hai.

---

## Part A: Supabase API Keys

### 1. Supabase Dashboard Kholo

https://supabase.com mein apna project kholo

### 2. Settings Mein Jao

1. Left sidebar mein **"Settings"** par click karo (gear icon ⚙️)
2. **"API"** tab par click karo

### 3. Teen Values Copy Karo

#### Value 1: Project URL
- **Location**: "Project URL" section
- **Example**: `https://abcdefgh.supabase.co`
- Copy button par click karo ya manually copy karo
- **Save karo** ise notepad mein

#### Value 2: Anon Public Key
- **Location**: "Project API keys" section
- **Label**: `anon` `public`
- Bahut lambi string hogi (200+ characters)
- Starts with: `eyJ...`
- **"Copy"** button par click karo
- **Save karo** ise notepad mein

#### Value 3: Service Role Key
- **Location**: "Project API keys" section  
- **Label**: `service_role` `secret`
- Show/Reveal button par click karo
- Ye bhi bahut lambi string hogi
- Starts with: `eyJ...`
- **"Copy"** button par click karo
- **⚠️ IMPORTANT**: Ye secret key hai, carefully save karo

---

## Part B: Groq API Key

### 1. Groq Console Kholo

https://console.groq.com par jao

### 2. Sign Up / Sign In

- Google ya GitHub se sign in kar sakte ho
- Free account bana lo (credit card nahi chahiye)

### 3. API Key Banao

1. Left sidebar ya top mein **"API Keys"** section dhundo
2. **"Create API Key"** button par click karo
3. Name do (optional): `Meeting AI`
4. **"Create"** par click karo
5. Key dikhegi - **immediately copy karo**
6. ⚠️ **Note**: Ye key sirf ek baar dikhegi, phir nahi milegi
7. **Save karo** notepad mein

---

## Part C: Environment Files Mein Paste Karo

### Backend Environment File

File: `backend/.env`

```env
PORT=5000
SUPABASE_URL=yahan_project_url_paste_karo
SUPABASE_SERVICE_KEY=yahan_service_role_key_paste_karo
GROQ_API_KEY=yahan_groq_api_key_paste_karo
```

**Example** (apni values se replace karo):
```env
PORT=5000
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=gsk_1234567890abcdefg...
```

### Frontend Environment File

File: `frontend/.env`

```env
VITE_SUPABASE_URL=yahan_project_url_paste_karo
VITE_SUPABASE_ANON_KEY=yahan_anon_public_key_paste_karo
VITE_API_URL=http://localhost:5000/api
```

**Example** (apni values se replace karo):
```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
```

---

## ⚠️ Important Notes

### Do NOT:
- ❌ GitHub par commit mat karo `.env` files ko
- ❌ Service role key publicly share mat karo
- ❌ Screenshot share karte waqt keys visible mat karo

### Keys Ka Security:
- `.gitignore` file already hai (keys safe hai)
- Production mein separate keys use karo
- Keys kabhi hardcode mat karo code mein

---

## Verify Karo

### Check Files Exist:
```bash
# Backend
cd backend
type .env

# Frontend  
cd frontend
type .env
```

Dono files mein values properly filled honi chahiye.

---

## Issues?

### "File not found" Error
- `.env` file nahi bani
- Manually banao: Right click → New → Text Document
- Name exactly `.env` rakho (dot zaroori hai)

### Keys Kaam Nahi Kar Rahi
- Extra spaces check karo
- Quotes ( `"` ) mat lagao values ke around
- Copy-paste carefully karo

### Groq Key Mil Nahi Rahi
- Console mein check karo: https://console.groq.com/keys
- Nahi mili toh nayi key banao

---

**✅ Setup Complete!**

Ab application run karne ke ready ho:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Application khulega: http://localhost:5173
