-- =====================================================
-- MIGRATION: Team Invitations and Enhanced Permissions
-- =====================================================

-- Create invitations table for team member invites
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_restaurant ON public.invitations(restaurant_id);

-- RLS Policies for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Only restaurant owners/admins can create invitations
CREATE POLICY "Restaurant owners and admins can create invitations"
    ON public.invitations
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT rm.restaurant_id
            FROM public.restaurant_members rm
            WHERE rm.user_id = auth.uid()
            AND rm.role IN ('owner', 'admin', 'manager')
        )
    );

-- Only restaurant owners/admins can view their restaurant's invitations
CREATE POLICY "Restaurant owners and admins can view invitations"
    ON public.invitations
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT rm.restaurant_id
            FROM public.restaurant_members rm
            WHERE rm.user_id = auth.uid()
            AND rm.role IN ('owner', 'admin', 'manager')
        )
    );

-- Only restaurant owners/admins can delete invitations
CREATE POLICY "Restaurant owners and admins can delete invitations"
    ON public.invitations
    FOR DELETE
    USING (
        restaurant_id IN (
            SELECT rm.restaurant_id
            FROM public.restaurant_members rm
            WHERE rm.user_id = auth.uid()
            AND rm.role IN ('owner', 'admin', 'manager')
        )
    );

-- Add permissions column to restaurant_members for granular control
ALTER TABLE public.restaurant_members
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
    "reservations": {"view": true, "create": true, "update": true, "delete": true},
    "analytics": {"view": false},
    "settings": {"view": false, "update": false},
    "services": {"view": false, "create": false, "update": false, "delete": false},
    "rooms": {"view": false, "create": false, "update": false, "delete": false},
    "team": {"view": false, "invite": false, "manage": false}
}'::jsonb;

-- Function to set default permissions based on role
CREATE OR REPLACE FUNCTION set_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Set permissions based on role
    CASE NEW.role
        WHEN 'owner' THEN
            NEW.permissions := '{
                "reservations": {"view": true, "create": true, "update": true, "delete": true},
                "analytics": {"view": true},
                "settings": {"view": true, "update": true},
                "services": {"view": true, "create": true, "update": true, "delete": true},
                "rooms": {"view": true, "create": true, "update": true, "delete": true},
                "team": {"view": true, "invite": true, "manage": true}
            }'::jsonb;
        WHEN 'admin' THEN
            NEW.permissions := '{
                "reservations": {"view": true, "create": true, "update": true, "delete": true},
                "analytics": {"view": true},
                "settings": {"view": true, "update": true},
                "services": {"view": true, "create": true, "update": true, "delete": true},
                "rooms": {"view": true, "create": true, "update": true, "delete": true},
                "team": {"view": true, "invite": true, "manage": true}
            }'::jsonb;
        WHEN 'manager' THEN
            NEW.permissions := '{
                "reservations": {"view": true, "create": true, "update": true, "delete": true},
                "analytics": {"view": true},
                "settings": {"view": true, "update": false},
                "services": {"view": true, "create": true, "update": true, "delete": true},
                "rooms": {"view": true, "create": true, "update": true, "delete": true},
                "team": {"view": true, "invite": false, "manage": false}
            }'::jsonb;
        WHEN 'staff' THEN
            NEW.permissions := '{
                "reservations": {"view": true, "create": false, "update": true, "delete": true},
                "analytics": {"view": false},
                "settings": {"view": false, "update": false},
                "services": {"view": false, "create": false, "update": false, "delete": false},
                "rooms": {"view": false, "create": false, "update": false, "delete": false},
                "team": {"view": false, "invite": false, "manage": false}
            }'::jsonb;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set permissions on insert/update
DROP TRIGGER IF EXISTS set_permissions_on_member ON public.restaurant_members;
CREATE TRIGGER set_permissions_on_member
    BEFORE INSERT OR UPDATE OF role ON public.restaurant_members
    FOR EACH ROW
    EXECUTE FUNCTION set_default_permissions();

-- Update existing members with default permissions
UPDATE public.restaurant_members
SET permissions = CASE role
    WHEN 'owner' THEN '{
        "reservations": {"view": true, "create": true, "update": true, "delete": true},
        "analytics": {"view": true},
        "settings": {"view": true, "update": true},
        "services": {"view": true, "create": true, "update": true, "delete": true},
        "rooms": {"view": true, "create": true, "update": true, "delete": true},
        "team": {"view": true, "invite": true, "manage": true}
    }'::jsonb
    WHEN 'admin' THEN '{
        "reservations": {"view": true, "create": true, "update": true, "delete": true},
        "analytics": {"view": true},
        "settings": {"view": true, "update": true},
        "services": {"view": true, "create": true, "update": true, "delete": true},
        "rooms": {"view": true, "create": true, "update": true, "delete": true},
        "team": {"view": true, "invite": true, "manage": true}
    }'::jsonb
    WHEN 'manager' THEN '{
        "reservations": {"view": true, "create": true, "update": true, "delete": true},
        "analytics": {"view": true},
        "settings": {"view": true, "update": false},
        "services": {"view": true, "create": true, "update": true, "delete": true},
        "rooms": {"view": true, "create": true, "update": true, "delete": true},
        "team": {"view": true, "invite": false, "manage": false}
    }'::jsonb
    ELSE '{
        "reservations": {"view": true, "create": false, "update": true, "delete": true},
        "analytics": {"view": false},
        "settings": {"view": false, "update": false},
        "services": {"view": false, "create": false, "update": false, "delete": false},
        "rooms": {"view": false, "create": false, "update": false, "delete": false},
        "team": {"view": false, "invite": false, "manage": false}
    }'::jsonb
END
WHERE permissions IS NULL;
