-- Add type column to meetings table
ALTER TABLE meetings ADD COLUMN result_type TEXT DEFAULT 'standard';
-- Note: 'type' might be a reserved word in some contexts, safely using 'meeting_type' or just 'type' if postgres allows. 
-- Postgres allows 'type' as column name but it's often better to avoid.
-- Let's stick to the plan but be careful.
-- actually, let's use 'meeting_type' to be safe, or just 'type' if we are sure.
-- The user request didn't specify column names.
-- Let's use 'type' as per plan, but quote it if needed.
ALTER TABLE meetings ADD COLUMN type TEXT DEFAULT 'standard';

-- Add audio_file_url for the single group audio file
ALTER TABLE meetings ADD COLUMN audio_file_url TEXT;
