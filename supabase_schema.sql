-- Organization Feature Database Schema
-- Run this in Supabase SQL Editor

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invite_code ON organizations(invite_code);
CREATE INDEX IF NOT EXISTS idx_org_domain ON organizations(domain);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their organization"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organization"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can join organizations"
    ON organization_members FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can leave organizations"
    ON organization_members FOR DELETE
    USING (user_id = auth.uid());

-- =====================================================
-- MULTI-ORG MIGRATION (Run these for existing databases)
-- =====================================================

-- Add slug column to organizations for URL-friendly identifiers
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);

-- Generate slugs for existing organizations (based on domain)
UPDATE organizations 
SET slug = LOWER(REPLACE(REPLACE(domain, '.', '-'), '@', ''))
WHERE slug IS NULL;

-- Make slug NOT NULL after migration
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;

-- Function to generate unique slug from org name
CREATE OR REPLACE FUNCTION generate_org_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure minimum length
    IF LENGTH(base_slug) < 3 THEN
        base_slug := base_slug || '-org';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

