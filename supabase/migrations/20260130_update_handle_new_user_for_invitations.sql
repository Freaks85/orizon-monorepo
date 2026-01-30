-- =====================================================
-- Update handle_new_user function to support invitations
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_restaurant_id uuid;
    invitation_data record;
    invitation_token text;
BEGIN
    -- Check if user signed up via invitation
    invitation_token := new.raw_user_meta_data->>'invitation_token';

    IF invitation_token IS NOT NULL THEN
        -- Get invitation details
        SELECT id, restaurant_id, role
        INTO invitation_data
        FROM public.invitations
        WHERE token = invitation_token
        AND email = new.email
        AND accepted_at IS NULL
        AND expires_at > NOW();

        IF FOUND THEN
            -- Add user to restaurant with role from invitation
            INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
            VALUES (invitation_data.restaurant_id, new.id, invitation_data.role)
            ON CONFLICT (restaurant_id, user_id) DO NOTHING;

            -- Mark invitation as accepted
            UPDATE public.invitations
            SET accepted_at = NOW(),
                updated_at = NOW()
            WHERE id = invitation_data.id;

            RETURN new;
        END IF;
    END IF;

    -- Default behavior: create new restaurant for owner
    INSERT INTO public.restaurants (name, owner_id)
    VALUES (
        coalesce(new.raw_user_meta_data->>'restaurant_name', 'Mon Restaurant'),
        new.id
    ) RETURNING id INTO new_restaurant_id;

    INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
    VALUES (new_restaurant_id, new.id, 'owner');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
