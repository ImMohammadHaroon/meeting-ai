-- Live Meetings Migration
-- Run this script in Supabase SQL Editor to add live meeting feature

-- Create live_meetings table
CREATE TABLE live_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  room_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'live', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create live_participants table
CREATE TABLE live_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_meeting_id UUID REFERENCES live_meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT TRUE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  UNIQUE(live_meeting_id, user_id)
);

-- Create meeting_recordings table (for chunked or full recordings)
CREATE TABLE meeting_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_meeting_id UUID REFERENCES live_meetings(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_live_meetings_meeting_id ON live_meetings(meeting_id);
CREATE INDEX idx_live_meetings_room_id ON live_meetings(room_id);
CREATE INDEX idx_live_meetings_status ON live_meetings(status);
CREATE INDEX idx_live_participants_live_meeting_id ON live_participants(live_meeting_id);
CREATE INDEX idx_live_participants_user_id ON live_participants(user_id);
CREATE INDEX idx_meeting_recordings_live_meeting_id ON meeting_recordings(live_meeting_id);

-- Enable Row Level Security
ALTER TABLE live_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_meetings
CREATE POLICY "Users can view live meetings they created or participate in"
  ON live_meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = live_meetings.meeting_id
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

CREATE POLICY "Users can create live meetings for their meetings"
  ON live_meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = live_meetings.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their live meetings"
  ON live_meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = live_meetings.meeting_id
      AND meetings.created_by = auth.uid()
    )
  );

-- RLS Policies for live_participants
CREATE POLICY "Users can view participants of their live meetings"
  ON live_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_meetings lm
      JOIN meetings m ON m.id = lm.meeting_id
      WHERE lm.id = live_participants.live_meeting_id
      AND (
        m.created_by = auth.uid() OR
        live_participants.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage live participants"
  ON live_participants FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- RLS Policies for meeting_recordings
CREATE POLICY "Users can view recordings of their meetings"
  ON meeting_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_meetings lm
      JOIN meetings m ON m.id = lm.meeting_id
      WHERE lm.id = meeting_recordings.live_meeting_id
      AND (
        m.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM meeting_participants
          WHERE meeting_participants.meeting_id = m.id
          AND meeting_participants.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "System can manage recordings"
  ON meeting_recordings FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);
