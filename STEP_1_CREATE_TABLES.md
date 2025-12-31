# Step 1: Database Tables Banao

## Kya Karna Hai

Supabase SQL Editor mein ye SQL code run karna hai jo database tables banayega.

## Instructions

1. **Supabase Dashboard** kholo: https://supabase.com
2. Left sidebar mein **"SQL Editor"** par click karo
3. **"New query"** button par click karo
4. Neeche diye gaye **pure SQL code ko copy karo**
5. SQL Editor mein **paste karo**
6. **"Run"** button (ya Ctrl+Enter) press karo
7. Success message dikhe: ✅ **"Success. No rows returned"**

---

## SQL Code (Copy Karo)

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

-- Enable RLS (Row Level Security)
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

CREATE POLICY "System can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (TRUE);

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

---

## Verify Karo

SQL run karne ke baad check karo:

1. Left sidebar mein **"Table Editor"** par click karo
2. Ye 4 tables dikhengi:
   - ✅ meetings
   - ✅ meeting_participants
   - ✅ tasks
   - ✅ chat_messages

## Issues?

Agar error aaye toh:
- Check karo ki pure SQL code copy hua hai
- SQL Editor ko refresh karo aur dobara try karo
- Agar phir bhi issue ho toh mujhe batao

---

**Agle step ke liye**: `STEP_2_CREATE_STORAGE.md` file dekho
