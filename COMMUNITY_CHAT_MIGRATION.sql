-- Community Chat Migration
-- Run this script in Supabase SQL Editor to add community chat feature

-- Create community_messages table
CREATE TABLE community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_community_messages_meeting_id ON community_messages(meeting_id);
CREATE INDEX idx_community_messages_created_at ON community_messages(created_at);

-- Enable Row Level Security
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages from meetings they are part of
CREATE POLICY "Users can view community messages from their meetings"
  ON community_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = community_messages.meeting_id
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

-- RLS Policy: Users can send messages in meetings they are part of
CREATE POLICY "Users can create community messages in their meetings"
  ON community_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = community_messages.meeting_id
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
