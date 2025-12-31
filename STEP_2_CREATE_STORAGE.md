# Step 2: Storage Bucket Banao

## Kya Karna Hai

Audio files upload karne ke liye ek storage bucket banana hai Supabase mein.

## Instructions (Screenshots ke saath)

### Option 1: UI se Banao (Asaan Tarika)

1. **Supabase Dashboard** mein jao
2. Left sidebar mein **"Storage"** par click karo
3. **"New bucket"** ya **"Create a new bucket"** button par click karo
4. Form mein ye details bharo:
   
   **Name**: 
   ```
   meeting-audio
   ```
   (Exactly yahi naam likhna - koi spelling mistake nahi)
   
   **Public bucket**: 
   - Toggle button ko **ON** karo (green color)
   - Ya checkbox mein tick lagao
   
5. **"Create bucket"** par click karo
6. Success! Bucket ban gaya hai

### Option 2: SQL se Banao

Agar UI se nahi ban raha, toh SQL Editor mein ye run karo:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meeting-audio', 'meeting-audio', true);
```

---

## Verify Karo

1. Left sidebar mein **"Storage"** par click karo
2. List mein **"meeting-audio"** bucket dikhna chahiye
3. Bucket par click karo - empty folder dikhega (ye normal hai)

---

## Storage Bucket Settings (Optional)

Agar bucket settings check karni ho:

1. **meeting-audio** bucket par click karo
2. Settings icon (⚙️) par click karo
3. Check karo:
   - **Public**: ✅ Yes
   - **File size limit**: Default (50MB) theek hai

---

## Bucket Policies (Already Set)

Public bucket hai toh policies automatically set ho jayengi. Agar manually set karni ho:

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'meeting-audio');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meeting-audio' AND auth.role() = 'authenticated');
```

---

## Test Karo (Optional)

Bucket test karne ke liye:

1. Storage → meeting-audio bucket kholo
2. **"Upload file"** button par click karo
3. Koi bhi audio file (MP3/WAV) upload karo
4. File upload ho jaye toh ✅ Setup correct hai
5. Test file ko delete kar do

---

## Issues?

### "Bucket already exists" Error
- Matlab bucket pehle se ban chuka hai
- Koi problem nahi, aage badho

### "Permission denied" Error
- Check karo Public toggle ON hai
- Bucket delete karke dobara banao

### File upload nahi ho rahi
- Bucket public hai check karo
- File size 25MB se kam hai check karo

---

**✅ Database Setup Complete!**

Ab aapka database ready hai. Next steps:

1. API keys copy karo (`STEP_3_GET_API_KEYS.md`)
2. Environment variables set karo
3. Application run karo
