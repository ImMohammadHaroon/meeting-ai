-- =====================================================
-- MEETINGS-TO-ORGANIZATION MIGRATION
-- Run this after the multi-org migration
-- =====================================================

-- Add organization_id column to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for organization_id lookups
CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(organization_id);

-- Update existing meetings to belong to the creator's organization
-- (assigns to the FIRST organization the user belongs to)
UPDATE meetings m
SET organization_id = (
    SELECT om.organization_id 
    FROM organization_members om 
    WHERE om.user_id = m.created_by 
    LIMIT 1
)
WHERE m.organization_id IS NULL;

-- Make organization_id NOT NULL after migration (optional - uncomment if you want strict enforcement)
-- ALTER TABLE meetings ALTER COLUMN organization_id SET NOT NULL;

-- Enable RLS on meetings if not already enabled
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to prevent conflicts)
DROP POLICY IF EXISTS "Users can view meetings in their organizations" ON meetings;
DROP POLICY IF EXISTS "Users can create meetings in their organizations" ON meetings;
DROP POLICY IF EXISTS "Users can update meetings in their organizations" ON meetings;
DROP POLICY IF EXISTS "Users can delete meetings in their organizations" ON meetings;

-- RLS Policy: Users can view meetings from organizations they belong to
CREATE POLICY "Users can view meetings in their organizations"
    ON meetings FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can create meetings in organizations they belong to
CREATE POLICY "Users can create meetings in their organizations"
    ON meetings FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update meetings in their organizations
CREATE POLICY "Users can update meetings in their organizations"
    ON meetings FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Meeting creator can delete their meetings
CREATE POLICY "Users can delete meetings in their organizations"
    ON meetings FOR DELETE
    USING (
        created_by = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );
