-- =====================================================
-- MULTI-ORG MIGRATION (Run these for existing databases)
-- =====================================================

-- Add slug column to organizations for URL-friendly identifiers
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;

-- Drop existing unique constraint if it exists (to allow re-running)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_slug_key;

-- Generate UNIQUE slugs for existing organizations
-- Use org name + random suffix to ensure uniqueness
UPDATE organizations 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Now add the unique constraint and NOT NULL
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);

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
