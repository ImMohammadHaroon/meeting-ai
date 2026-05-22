-- Optional: run in Supabase SQL editor to tag extension-recorded meetings
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS source text;

COMMENT ON COLUMN meetings.source IS 'Origin of meeting, e.g. chrome_extension, web';
